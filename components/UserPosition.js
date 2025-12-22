"use client";

import { useEffect, useMemo, useState } from "react";
import { createPublicClient, http, parseAbiItem, formatEther } from "viem";
import { useSelector } from "react-redux";
import { useReadContracts, useWriteContract } from "wagmi";

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
	chain: local,
	transport: http(),
});

const COLLATERAL_EVENT = parseAbiItem(
	"event CollateralAdded(address indexed user, uint256 indexed amount, uint256 price)"
);

export default function CollateralAddedHistory() {
	const { abi } = useSelector((state) => state.data);

	const [events, setEvents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	/* ----------------------------------
	   Liquidate write hook
	---------------------------------- */
	const { writeContractAsync: writeLiquidate, isPending: liquidatePending } =
		useWriteContract();

	/* ----------------------------------
	   Load + Watch Events (deduped)
	---------------------------------- */
	useEffect(() => {
		let unwatch;

		async function init() {
			try {
				const logs = await publicClient.getLogs({
					address: LENDING_ADDRESS,
					event: COLLATERAL_EVENT,
					fromBlock: 0n,
					toBlock: "latest",
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

	const { data: positionsData, isPending } = useReadContracts({
		contracts,
		query: { enabled: contracts.length > 0 },
	});

	/* ----------------------------------
	   Normalize Results
	---------------------------------- */
	const positionsByUser = useMemo(() => {
		if (!positionsData) return {};

		const map = {};
		userAddresses.forEach((addr, i) => {
			const base = i * 4;

			map[addr] = {
				collateral: positionsData[base]?.result ?? 0n,
				borrowed: positionsData[base + 1]?.result ?? 0n,
				ratio: positionsData[base + 2]?.result ?? 0n,
				isLiquidatable: positionsData[base + 3]?.result ?? false,
			};
		});
		return map;
	}, [positionsData, userAddresses]);

	/* ----------------------------------
	   Liquidate handler
	---------------------------------- */
	const handleLiquidate = async (user) => {
		try {
			await writeLiquidate({
				address: LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "liquidate",
				args: [user],
			});
		} catch (err) {
			console.error(err);
		}
	};

	/* ----------------------------------
	   Render
	---------------------------------- */
	if (loading) return <p>Loading collateral users…</p>;
	if (error) return <p style={{ color: "red" }}>{error}</p>;

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<h2>Collateral Users (Live)</h2>

			{userAddresses.map((user) => {
				const pos = positionsByUser[user];

				return (
					<div
						key={user}
						style={{
							border: "1px solid #ccc",
							padding: 12,
							borderRadius: 6,
						}}
					>
						<div>
							<strong>User:</strong> {user}
						</div>

						{pos && (
							<>
								<div>
									<strong>Total Collateral:</strong>{" "}
									{formatEther(pos.collateral)}
								</div>
								<div>
									<strong>Total Borrowed:</strong> {formatEther(pos.borrowed)}
								</div>
								<div>
									<strong>Position Ratio:</strong>{" "}
									{Number(formatEther(String(pos.ratio) + "00")).toFixed(2)}%
								</div>

								{pos.isLiquidatable ? (
									<button
										onClick={() => handleLiquidate(user)}
										disabled={liquidatePending}
									>
										{liquidatePending ? "Liquidating..." : "Liquidate"}
									</button>
								) : (
									<button disabled className='opacity-25'>
										No Action
									</button>
								)}
							</>
						)}
					</div>
				);
			})}

			{isPending && <p>Updating positions…</p>}
		</div>
	);
}
