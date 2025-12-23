import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	useAccount,
	useBalance,
	useReadContract,
	useWriteContract,
} from "wagmi";
import { useSelector, useDispatch } from "react-redux";
import { parseEther, formatEther } from "viem";
import { toast } from "react-toastify";
import UserPosition from "../components/UserPosition";

export default function Hero() {
	const dispatch = useDispatch();
	const { abi } = useSelector((data) => data.data);
	const [userPositionKey, setUserPositionKey] = useState(0);
	const { address, isConnected } = useAccount();
	const {
		data: balance,
		isLoading,
		refetch: refetchNativeBalance,
	} = useBalance({
		address,
	});
	const [addCollateral, setAddCollateral] = useState(0);
	const [removeCollateral, setRemoveCollateral] = useState(0);
	const [borrow, setBorrow] = useState(0);
	const [repay, setRepay] = useState(0);
	const [ethToToken, setEthToToken] = useState(0);
	const [tokenToEth, setTokenToEth] = useState(0);
	const [totalCollateral, setTotalCollateral] = useState(0);
	const [totalBorrowed, setTotalBorrowed] = useState(0);

	const {
		data: readJcolBalance,
		isPending: readJcolBalancePending,
		error: readJcolBalanceError,
		refetch: refetchJcolBalance,
	} = useReadContract({
		query: {
			enabled: isConnected && !!address,
		},
		address: process.env.NEXT_PUBLIC_JCOL_ADDRESS,
		abi: abi.JCOL_ABI,
		functionName: "balanceOf",
		args: [address],
	});

	const {
		data: readUserCollateral,
		isPending: readUserCollateralPending,
		error: readUserCollateralError,
		refetch: refetchUserCollateral,
	} = useReadContract({
		query: {
			enabled: isConnected && !!address,
		},
		address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
		abi: abi.Lending_ABI,
		functionName: "s_userCollateral",
		args: [address],
	});

	const {
		data: readUserBorrowed,
		isPending: readUserBorrowedPending,
		error: readUserBorrowedError,
		refetch: refetchUserBorrowed,
	} = useReadContract({
		query: {
			enabled: isConnected && !!address,
		},
		address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
		abi: abi.Lending_ABI,
		functionName: "s_userBorrowed",
		args: [address],
	});

	const {
		data: readUserRatio,
		isPending: readUserRatioPending,
		error: readUserRatioError,
		refetch: refetchUserRatio,
	} = useReadContract({
		query: {
			enabled: isConnected && !!address,
		},
		address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
		abi: abi.Lending_ABI,
		functionName: "_calculatePositionRatio",
		args: [address],
	});

	const {
		data: readCurrentPrice,
		isPending: readCurrentPricePending,
		error: readCurrentPriceError,
		refetch: refetchCurrentPrice,
	} = useReadContract({
		query: {
			enabled: isConnected && !!address,
		},
		address: process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS,
		abi: abi.JCOLDEX_ABI,
		functionName: "currentPrice",
	});

	function refetchAll() {
		refetchUserRatio();
		refetchUserBorrowed();
		refetchUserCollateral();
		refetchJcolBalance();
		refetchNativeBalance();
		refetchCurrentPrice();
	}

	const {
		writeContractAsync: writeAddCollateral,
		isPending: addCollateralPending,
		data: addCollateralHash,
		error: addCollateralError,
	} = useWriteContract();

	const {
		writeContractAsync: writeRemoveCollateral,
		isPending: removeCollateralPending,
		data: removeCollateralHash,
		error: removeCollateralError,
	} = useWriteContract();

	const {
		writeContractAsync: writeBorrow,
		isPending: borrowPending,
		data: borrowHash,
		error: borrowError,
	} = useWriteContract();

	const {
		writeContractAsync: writeRepay,
		isPending: repayPending,
		data: repayHash,
		error: repayError,
	} = useWriteContract();

	const {
		writeContractAsync: writeApprove,
		isPending: approvePending,
		data: approveHash,
		error: approveError,
	} = useWriteContract();

	const {
		writeContractAsync: writeEthToToken,
		isPending: ethToTokenPending,
		data: ethToTokenHash,
		error: ethToTokenError,
	} = useWriteContract();

	const {
		writeContractAsync: writeTokenToEth,
		isPending: tokenToEthPending,
		data: tokenToEthHash,
		error: tokenToEthError,
	} = useWriteContract();

	const handleAddCollateral = async () => {
		if (!address) return;

		try {
			toast.info("Submitting Transaction...");
			await writeAddCollateral({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "addCollateral",
				value: parseEther(addCollateral),
			});

			toast.success("Transaction Success...");
			setAddCollateral(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.error(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}

		refetchUserCollateral();
		refetchUserRatio();
		refetchNativeBalance();
	};

	const handleRemoveCollateral = async () => {
		if (!address) return;

		try {
			toast.info("Submitting Transaction...");
			await writeRemoveCollateral({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "withdrawCollateral",
				args: [parseEther(removeCollateral)],
			});

			toast.success("Transaction Success...");
			setRemoveCollateral(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.error(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}

		refetchUserCollateral();
		refetchUserRatio();
		refetchNativeBalance();
	};

	const handleBorrow = async () => {
		if (!address) return;

		try {
			toast.info("Submitting Transaction...");
			await writeBorrow({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "borrowCorn",
				args: [parseEther(borrow)],
			});

			toast.success("Transaction Success...");
			setBorrow(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.error(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}

		refetchJcolBalance();
		refetchUserBorrowed();
		refetchUserRatio();
	};

	const handleRepay = async () => {
		if (!address) return;

		try {
			toast.info("Submitting Transaction...");
			await writeApprove({
				address: process.env.NEXT_PUBLIC_JCOL_ADDRESS,
				abi: abi.JCOL_ABI,
				functionName: "approve",
				args: [process.env.NEXT_PUBLIC_LENDING_ADDRESS, parseEther(repay)],
			});

			await writeRepay({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "repayCorn",
				args: [parseEther(repay)],
			});

			toast.success("Transaction Success...");
			setRepay(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.error(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}

		refetchJcolBalance();
		refetchUserBorrowed();
		refetchUserRatio();
	};

	const handleEthToToken = async () => {
		if (!address) return;

		try {
			toast.info("Submitting Transaction...");
			await writeEthToToken({
				address: process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS,
				abi: abi.JCOLDEX_ABI,
				functionName: "swap",
				args: [parseEther(ethToToken)],
				value: parseEther(ethToToken),
			});

			toast.success("Transaction Success...");
			setEthToToken(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.error(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}

		refetchJcolBalance();
		refetchUserRatio();
		refetchUserCollateral();
		refetchNativeBalance();
		refetchCurrentPrice();
	};
	const handleTokenToEth = async () => {
		if (!address) return;

		try {
			toast.info("Submitting Transaction...");

			await writeApprove({
				address: process.env.NEXT_PUBLIC_JCOL_ADDRESS,
				abi: abi.JCOL_ABI,
				functionName: "approve",
				args: [process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS, parseEther(tokenToEth)],
			});

			await writeTokenToEth({
				address: process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS,
				abi: abi.JCOLDEX_ABI,
				functionName: "swap",
				args: [parseEther(tokenToEth)],
			});

			toast.success("Transaction Success...");
			setTokenToEth(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.error(
				e.shortMessage || e.message || e.cause.shortMessage || e.cause.message
			);
		}

		refetchJcolBalance();
		refetchUserRatio();
		refetchUserCollateral();
		refetchNativeBalance();
		refetchCurrentPrice();
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

	return (
		<div className='w-full min-h-screen flex items-center justify-center'>
			<motion.div
				initial={{ transform: "translateX(-100px)", opacity: 0 }}
				whileInView={{ transform: "translateX(0px)", opacity: 1 }}
				exit={{ transform: "translateX(-100px)", opacity: 0 }}
				transition={{ duration: 0.5 }}
				className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-5'
			>
				<div className='grid grid-cols-4 gap-2 min-h-[300px]'>
					<div className='border-[1px] rounded-[10px] border-black w-full p-3'>
						<h1>State</h1>
						<p className='break-all'>Address: {address}</p>
						<p>
							ETH Balance: {balance?.formatted} {balance?.symbol}
						</p>
						<p>
							JCOL Balance:{" "}
							{readJcolBalance
								? formatNumber(formatEther(String(readJcolBalance)))
								: 0}{" "}
							JCOL
						</p>
						<p>
							User Collateral Balance:{" "}
							{readUserCollateral
								? formatNumber(formatEther(Number(readUserCollateral)))
								: 0}{" "}
							ETH
						</p>
						<p>
							User Debt Balance:{" "}
							{readUserBorrowed
								? formatNumber(formatEther(String(readUserBorrowed)))
								: 0}{" "}
							JCOL
						</p>
						<p>
							User Ratio:{" "}
							{readUserRatio
								? Number(formatEther(String(readUserRatio) + "00")).toFixed(2) >
								  999
									? "999"
									: Number(formatEther(String(readUserRatio) + "00")).toFixed(2)
								: 0}
							%
						</p>
						<p>
							Current Price:{" "}
							{readCurrentPrice
								? formatNumber(formatEther(String(readCurrentPrice)))
								: 0}
						</p>
						<p>Total Collateral: {totalCollateral ? totalCollateral : 0}</p>
						<p>Total Borrowed: {totalBorrowed ? totalBorrowed : 0}</p>
						<p>
							Total BCollateral / Borrowed:{" "}
							{totalBorrowed && totalCollateral && readCurrentPrice
								? (
										Number(
											formatEther(
												(Number(totalCollateral) * Number(readCurrentPrice)) /
													Number(totalBorrowed)
											)
										) * 100
								  ).toFixed(2)
								: 0}
							%
						</p>
					</div>
					<div className='border-[1px] rounded-[10px] border-black w-full p-3'>
						<h1>Collateral Operations</h1>
						<p>Add Collateral</p>
						<input
							type='number'
							className='bg-gray-200'
							onChange={(e) => setAddCollateral(e.target.value)}
							value={addCollateral}
						/>
						<button onClick={handleAddCollateral}>Submit</button>
						<p>Remove Collateral</p>
						<input
							type='number'
							className='bg-gray-200'
							onChange={(e) => setRemoveCollateral(e.target.value)}
							value={removeCollateral}
						/>
						<button onClick={handleRemoveCollateral}>Submit</button>
					</div>
					<div className='border-[1px] rounded-[10px] border-black w-full p-3'>
						<h1>Borrow Operations</h1>
						<p>Borrow</p>
						<input
							type='number'
							className='bg-gray-200'
							onChange={(e) => setBorrow(e.target.value)}
							value={borrow}
						/>
						<button onClick={handleBorrow}>Submit</button>
						<p>Repay</p>
						<input
							type='number'
							className='bg-gray-200'
							onChange={(e) => {
								setRepay(e.target.value);
							}}
							value={repay}
						/>
						<button
							onClick={() => {
								handleRepay();
							}}
						>
							Submit
						</button>
					</div>
					<div className='border-[1px] rounded-[10px] border-black w-full p-3'>
						<h1>Swap Operations</h1>
						<p>ETH to Token</p>
						<input
							type='number'
							className='bg-gray-200'
							onChange={(e) => setEthToToken(e.target.value)}
							value={ethToToken}
						/>
						<button onClick={handleEthToToken}>Submit</button>
						<p>Token to ETH</p>
						<input
							type='number'
							className='bg-gray-200'
							onChange={(e) => setTokenToEth(e.target.value)}
							value={tokenToEth}
						/>
						<button onClick={handleTokenToEth}>Submit</button>
					</div>
				</div>
				<div>
					<UserPosition
						key={userPositionKey}
						refetchAll={refetchAll}
						setTotalCollateral={setTotalCollateral}
						setTotalBorrowed={setTotalBorrowed}
					/>
				</div>
			</motion.div>
		</div>
	);
}
