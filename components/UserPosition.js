"use client";

import { useEffect, useMemo, useState } from "react";
import { createPublicClient, http, parseAbiItem, formatEther } from "viem";
import { useSelector } from "react-redux";
import { useReadContracts, useWriteContract } from "wagmi";
import { toast } from "react-toastify";
import { MdElectricBolt } from "react-icons/md";
import { FaWallet } from "react-icons/fa";
import { sepolia } from "wagmi/chains";

const LENDING_ADDRESS = process.env.NEXT_PUBLIC_LENDING_ADDRESS;

const local = {
	id: 31337,
	name: "Local Testnet",
	nativeCurrency: { name: "Local Network", symbol: "ETH", decimals: 18 },
	rpcUrls: {
		default: { http: ["http://127.0.0.1:8545"] },
	},
	testnet: true,
};

const publicClient = createPublicClient({
	chain: sepolia,
	transport: http(),
});

const COLLATERAL_EVENT = parseAbiItem(
	"event CollateralAdded(address indexed user, uint256 indexed amount, uint256 price)"
);

export default function CollateralAddedHistory({
	refetchAll,
	setTotalCollateral,
	setTotalBorrowed,
}) {
	const { abi } = useSelector((state) => state.data);

	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const ITEMS_PER_PAGE = 5;
	const [currentPage, setCurrentPage] = useState(1);

	/* ----------------------------------
	   Liquidate write hook
	---------------------------------- */
	const { writeContractAsync: writeLiquidate, isPending: liquidatePending } =
		useWriteContract();
	const { writeContractAsync: writeApprove, isPending: approvePending } =
		useWriteContract();

	/* ----------------------------------
	   Load + Watch Events (deduped)
	---------------------------------- */
	useEffect(() => {
		let unwatch;

		async function init() {
			try {
				const latestBlock = await publicClient.getBlockNumber();

				const fromBlock =
					latestBlock > 9000n ? latestBlock - 9000n : 0n;

				const logs = await publicClient.getLogs({
					address: LENDING_ADDRESS,
					event: COLLATERAL_EVENT,
					fromBlock,
					toBlock: latestBlock,
				});

				setEvents(
					logs.map((log) => ({
						user: log.args.user,
						txHash: log.transactionHash,
						logIndex: log.logIndex,
					}))
				);

				unwatch = publicClient.watchEvent({
					address: LENDING_ADDRESS,
					event: COLLATERAL_EVENT,
					onLogs: (logs) => {
						setEvents((prev) => {
							const seen = new Set(
								prev.map((e) => `${e.txHash}-${e.logIndex}`)
							);

							const fresh = logs
								.map((log) => ({
									user: log.args.user,
									txHash: log.transactionHash,
									logIndex: log.logIndex,
								}))
								.filter((e) => !seen.has(`${e.txHash}-${e.logIndex}`));

							return [...prev, ...fresh];
						});
					},
				});
			} catch (err) {
				setError(err?.message || "Failed to load events");
			} finally {
				setLoading(false);
			}
		}

		if (LENDING_ADDRESS) init();
		return () => unwatch?.();
	}, []);

	/* ----------------------------------
	   Unique Users
	---------------------------------- */
	const userAddresses = useMemo(
		() => [...new Set(events.map((e) => e.user))],
		[events]
	);

	/* ----------------------------------
	   Batch Reads (4 per user)
	---------------------------------- */
	const contracts = useMemo(() => {
		if (!abi?.Lending_ABI || userAddresses.length === 0) return [];

		return userAddresses.flatMap((addr) => [
			{
				address: LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "s_userCollateral",
				args: [addr],
			},
			{
				address: LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "s_userBorrowed",
				args: [addr],
			},
			{
				address: LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "_calculatePositionRatio",
				args: [addr],
			},
			{
				address: LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "isLiquidatable",
				args: [addr],
			},
		]);
	}, [abi, userAddresses]);

	const {
		data: positionsData,
		isPending,
		refetch: refetchPositions,
	} = useReadContracts({
		contracts,
		query: { enabled: contracts.length > 0 },
	});

	/* ----------------------------------
	   Normalize Results
	---------------------------------- */
	const positionsByUser = useMemo(() => {
		if (!positionsData) return {};

		let totalCollateral = 0n;
		let totalBorrowed = 0n;

		const entries = userAddresses.map((addr, i) => {
			const base = i * 4;

			const collateral = positionsData[base]?.result ?? 0n;
			const borrowed = positionsData[base + 1]?.result ?? 0n;
			const ratio = positionsData[base + 2]?.result ?? 0n;
			const isLiquidatable = positionsData[base + 3]?.result ?? false;

			totalCollateral += collateral;
			totalBorrowed += borrowed;

			return [
				addr,
				{
					collateral,
					borrowed,
					ratio,
					isLiquidatable,
				},
			];
		});

		// sort by ratio ascending
		entries.sort((a, b) => {
			if (a[1].ratio < b[1].ratio) return -1;
			if (a[1].ratio > b[1].ratio) return 1;
			return 0;
		});


		setTotalBorrowed(formatEther(totalBorrowed));
		setTotalCollateral(formatEther(totalCollateral));

		return Object.fromEntries([...entries]);
	}, [positionsData, userAddresses]);

	/* ----------------------------------
	   Liquidate handler
	---------------------------------- */
	const handleLiquidate = async (user, amount) => {
		try {
			toast.dark("Submitting Transaction...");

			const hash = await writeApprove({
				address: process.env.NEXT_PUBLIC_JCOL_ADDRESS,
				abi: abi.JCOL_ABI,
				functionName: "approve",
				args: [LENDING_ADDRESS, amount],
			});

			await publicClient.waitForTransactionReceipt({ hash });

			const txHash = await writeLiquidate({
				address: LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "liquidate",
				args: [user],
			});

			await publicClient.waitForTransactionReceipt({
				hash: txHash,
			});

			await refetchPositions();

			refetchAll();

			toast.dark("Transaction Success...");
		} catch (e) {
			toast.dark(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}
	};



	function formatNumber(num) {
		if (num === null || num === undefined) return "0";

		const n = Number(num);
		const abs = Math.abs(n);

		if (abs >= 1e12) return (n / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
		if (abs >= 1e9) return (n / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
		if (abs >= 1e6) return (n / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
		if (abs >= 1e3) return (n / 1e3).toFixed(2).replace(/\.00$/, "") + "K";

		return n.toFixed(2).toString();
	}

	const paginatedEntries = useMemo(() => {
		const entries = Object.entries(positionsByUser);

		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;

		return entries.slice(start, end);
	}, [positionsByUser, currentPage]);

	const totalPages = useMemo(() => {
		return Math.ceil(
			Object.keys(positionsByUser).length / ITEMS_PER_PAGE
		);
	}, [positionsByUser]);

	if (loading) return <p>Loading collateral users…</p>;
	if (error) return <p style={{ color: "red" }}>{error}</p>;

	return (
		<div className="flex flex-col items-center justify-center gap-4 w-full">
			<div className="flex flex-col gap-2 w-full px-0 sm:px-8 overflow-auto custom-scrollbar">
				<div className="grid w-full min-w-[1100px] [&>*]:text-gray-400 border-b-[1px] py-[1rem] border-[rgba(255,255,255,.1)] px-4 gap-6" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr" }}>
					<p>Address</p>
					<p>Collateral (ETH)</p>
					<p>Borrowed (JCOL)</p>
					<p>Position Ratio</p>
					<p>Health Factor</p>
					<p className="text-center">Action</p>
				</div>
				{[...paginatedEntries].map(([user, pos], index) => {
					return (
						<div
							key={user}
							className="grid w-full min-w-[1100px] border-b-[1px] py-[1rem] border-[rgba(255,255,255,.1)] px-4 hover:bg-[rgba(255,255,255,.01)] gap-6"
							style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr" }}
						>
							<div className="font-bold text-base flex items-center justify-start gap-2">
								<div className="text-green-400 bg-[#113839] w-fit h-fit py-1 px-3 rounded-[10px]">
									<FaWallet />
								</div>{user.slice(0, 6)}...{user.slice(-6)}
							</div>
							<div className="font-bold text-base text-green-400 flex items-center justify-start">
								{formatNumber(formatEther(pos.collateral))} ETH
							</div>
							<div className="font-bold text-base text-blue-400 flex items-center justify-start">
								{formatNumber(formatEther(pos.borrowed))} JCOL
							</div>
							<div className={` flex items-center justify-start font-bold text-base w-fit h-fit py-1 px-2 rounded-[100px] ${Number(formatEther(String(pos.ratio) + "00")) >= 150 ? " text-green-400 bg-[#113839]" : Number(formatEther(String(pos.ratio) + "00")) < 150 && Number(formatEther(String(pos.ratio) + "00")) > 120 ? " text-yellow-400 bg-[#393711]" : " text-red-400 bg-[#391111]"}`}>
								{Number(formatEther(String(pos.ratio) + "00")).toFixed(2) > 999 ? ">999" : Number(formatEther(String(pos.ratio) + "00")).toFixed(2)}%
							</div>
							<div className={` flex items-center justify-start font-bold text-base w-fit h-fit py-1 px-2 rounded-[100px] ${Number(formatEther(String(pos.ratio) + "00")) > 150 ? " text-green-400 bg-[#113839]" : Number(formatEther(String(pos.ratio) + "00")) < 150 && Number(formatEther(String(pos.ratio) + "00")) > 120 ? " text-yellow-400 bg-[#393711]" : " text-red-400 bg-[#391111]"}`}>
								{(Number(formatEther(String(pos.ratio) + "00")) / 120).toFixed(2) > 999 ? ">999" : (Number(formatEther(String(pos.ratio) + "00")) / 120).toFixed(2)}
							</div>

							<button
								onClick={() => handleLiquidate(user, pos.borrowed)}
								disabled={!pos.isLiquidatable}
								className=" disabled:opacity-30 bg-red-600 text-white py-2 px-4 text-center flex items-center justify-center gap-1 rounded-[10px]"
							>
								<MdElectricBolt />
								{liquidatePending ? "Liquidating..." : "Liquidate"}
							</button>
						</div>
					);
				})}
			</div>
			<div className="flex items-center justify-end gap-3 py-4">
				<button
					onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
					disabled={currentPage === 1}
					className="px-4 py-2 rounded-md bg-[#113839] text-green-400 disabled:opacity-30"
				>
					Prev
				</button>

				<span className="text-sm text-gray-400">
					Page {currentPage} of {totalPages}
				</span>

				<button
					onClick={() =>
						setCurrentPage((p) => Math.min(p + 1, totalPages))
					}
					disabled={currentPage === totalPages}
					className="px-4 py-2 rounded-md bg-[#113839] text-green-400 disabled:opacity-30"
				>
					Next
				</button>
			</div>
		</div>
	);
}
