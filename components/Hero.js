import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	useAccount,
	useBalance,
	useReadContract,
	useWriteContract,
	usePublicClient
} from "wagmi";
import { useSelector, useDispatch } from "react-redux";
import { parseEther, formatEther } from "viem";
import { toast } from "react-toastify";
import UserPosition from "../components/UserPosition";
import { FaEthereum } from "react-icons/fa";
import { FaCoins } from "react-icons/fa";
import { PiVaultFill } from "react-icons/pi";
import { FaHandHoldingUsd } from "react-icons/fa";
import { IoMdSwap } from "react-icons/io";
import { FaPlus, FaMinus } from "react-icons/fa";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";
import { FaChartLine } from "react-icons/fa6";

export default function Hero() {
	const dispatch = useDispatch();
	const publicClient = usePublicClient();
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
	const [collateral, setCollateral] = useState(0);
	const [borrow, setBorrow] = useState(0);
	const [repay, setRepay] = useState(0);
	const [borrowRepay, setBorrowRepay] = useState(0);
	const [ethToToken, setEthToToken] = useState(0);
	const [tokenToEth, setTokenToEth] = useState(0);
	const [token, setToken] = useState(0);
	const [totalCollateral, setTotalCollateral] = useState(0);
	const [totalBorrowed, setTotalBorrowed] = useState(0);
	const [from, setFrom] = React.useState('ETH');

	const handleChange = (event) => {
		setFrom(event.target.value);
	};

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
			toast.dark("Submitting Transaction...");
			const hash = await writeAddCollateral({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "addCollateral",
				value: parseEther(collateral),
			});

			await publicClient.waitForTransactionReceipt({ hash });

			toast.dark("Transaction Success...");
			setCollateral(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.dark(
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
			toast.dark("Submitting Transaction...");
			const hash = await writeRemoveCollateral({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "withdrawCollateral",
				args: [parseEther(collateral)],
			});

			await publicClient.waitForTransactionReceipt({ hash });

			toast.dark("Transaction Success...");
			setCollateral(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.dark(
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
			toast.dark("Submitting Transaction...");
			const hash = await writeBorrow({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "borrowCorn",
				args: [parseEther(borrowRepay)],
			});

			await publicClient.waitForTransactionReceipt({ hash });

			toast.dark("Transaction Success...");
			setBorrowRepay(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.dark(
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
			toast.dark("Submitting Transaction...");
			const hash = await writeApprove({
				address: process.env.NEXT_PUBLIC_JCOL_ADDRESS,
				abi: abi.JCOL_ABI,
				functionName: "approve",
				args: [process.env.NEXT_PUBLIC_LENDING_ADDRESS, parseEther(borrowRepay)],
			});

			await publicClient.waitForTransactionReceipt({ hash });

			const hash2 = await writeRepay({
				address: process.env.NEXT_PUBLIC_LENDING_ADDRESS,
				abi: abi.Lending_ABI,
				functionName: "repayCorn",
				args: [parseEther(borrowRepay)],
			});

			await publicClient.waitForTransactionReceipt({ hash: hash2 });

			toast.dark("Transaction Success...");
			setBorrowRepay(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.dark(
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
			toast.dark("Submitting Transaction...");
			const hash = await writeEthToToken({
				address: process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS,
				abi: abi.JCOLDEX_ABI,
				functionName: "swap",
				args: [parseEther(token)],
				value: parseEther(token),
			});

			await publicClient.waitForTransactionReceipt({ hash });

			toast.dark("Transaction Success...");
			setToken(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.dark(
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
			toast.dark("Submitting Transaction...");

			const hash = await writeApprove({
				address: process.env.NEXT_PUBLIC_JCOL_ADDRESS,
				abi: abi.JCOL_ABI,
				functionName: "approve",
				args: [process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS, parseEther(token)],
			});

			await publicClient.waitForTransactionReceipt({ hash });

			const hash2 = await writeTokenToEth({
				address: process.env.NEXT_PUBLIC_JCOLDEX_ADDRESS,
				abi: abi.JCOLDEX_ABI,
				functionName: "swap",
				args: [parseEther(token)],
			});

			await publicClient.waitForTransactionReceipt({ hash: hash2 });

			toast.dark("Transaction Success...");
			setToken(0);
			setUserPositionKey((k) => k + 1);
		} catch (e) {
			toast.dark(
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
		<div className='w-full min-h-screen flex items-center justify-center [&>*]:text-white'>
			<motion.div
				initial={{ transform: "translateX(-100px)", opacity: 0 }}
				whileInView={{ transform: "translateX(0px)", opacity: 1 }}
				exit={{ transform: "translateX(-100px)", opacity: 0 }}
				transition={{ duration: 0.5 }}
				className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-5 mt-24 w-full'
			>
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 w-full gap-4'>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full p-4 rounded-[10px] flex flex-col items-center justify-around'>
						<p className='text-gray-400 text-lg flex items-center justify-center gap-1'>
							<FaEthereum className='text-blue-400' />
							ETH Balance
						</p>
						<p className='text-2xl font-bold'>
							{balance?.formatted ? Number(balance?.formatted).toFixed(0) : 0} {balance?.symbol ? balance?.symbol : "ETH"}
						</p>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full p-4 rounded-[10px] flex flex-col items-center justify-around'>
						<p className='text-gray-400 text-lg flex items-center justify-center gap-1'>
							<FaCoins className='text-green-400' />
							JCOL Balance
						</p>
						<p className='text-2xl font-bold'>
							{readJcolBalance
								? formatNumber(formatEther(String(readJcolBalance)))
								: 0}{" "}
							JCOL
						</p>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full p-4 rounded-[10px] flex flex-col items-center justify-around'>
						<p className='text-gray-400 text-lg flex items-center justify-center gap-1'>
							Your Collateral
						</p>
						<p className='text-2xl font-bold text-green-400'>
							{readUserCollateral
								? formatNumber(formatEther(Number(readUserCollateral)))
								: 0}{" "}
							ETH
						</p>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full p-4 rounded-[10px] flex flex-col items-center justify-around'>
						<p className='text-gray-400 text-lg'>Your Borrowed</p>
						<p className='text-2xl font-bold text-blue-400'>
							{readUserBorrowed
								? formatNumber(formatEther(String(readUserBorrowed)))
								: 0}{" "}
							JCOL
						</p>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full p-4 rounded-[10px] flex flex-col items-center justify-around'>
						<p className='text-gray-400 text-lg'>Your Ratio</p>
						<p className='text-2xl font-bold'>
							{readUserRatio
								? Number(formatEther(String(readUserRatio) + "00")).toFixed(2) >
									999
									? ">999"
									: Number(formatEther(String(readUserRatio) + "00")).toFixed(2)
								: 0}
							%
						</p>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full p-4 rounded-[10px] flex flex-col items-center justify-around'>
						<p className='text-gray-400 text-lg'>Total Col/Bor</p>
						<p className='text-2xl font-bold'>
							{totalBorrowed && totalCollateral && readCurrentPrice
								? isNaN((
									Number(
										formatEther(
											(Number(totalCollateral) * Number(readCurrentPrice)) /
											Number(totalBorrowed)
										)
									) * 100
								).toFixed(2)) ? "0" : (
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
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[200px] w-full'>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full py-6 px-4 rounded-[10px] flex flex-col items-start justify-start gap-4'>
						<p className='text-xl font-bold flex items-center justify-center gap-2'>
							<PiVaultFill className="text-green-400 text-3xl" />
							Collateral Operations
						</p>
						<div className="text-gray-400 bg-[#18212f] p-4 w-full flex flex-col gap-2 rounded-[10px]">
							<p>Amount (ETH)</p>
							<input onChange={(e) => setCollateral(e.target.value)} value={collateral} type="number" className="bg-[#030712] outline-none border-[1px] border-[rgba(255,255,255,.2)] py-2 px-3 text-xl rounded-[10px]" placeholder="0" />
						</div>
						<div className="flex items-center justify-center w-full gap-4">
							<button className="bg-green-400 text-[#04161a] flex items-center justify-center gap-3 py-2 px-3 w-full rounded-[10px] font-bold text-lg" onClick={handleAddCollateral}><FaPlus /> Add</button>
							<button className="bg-[#18212f] text-[#04161a] flex items-center justify-center gap-3 py-2 px-3 w-full rounded-[10px] font-bold text-lg text-white" onClick={handleRemoveCollateral}><FaMinus /> Remove</button>
						</div>
						<div className="text-gray-400 bg-[#18212f] p-4 w-full flex flex-col gap-2 rounded-[10px]">
							<div className="flex items-center justify-between gap-4">
								<p>Total Collateral: </p>
								<p className="text-green-400 font-bold">{totalCollateral ? formatNumber(totalCollateral) : 0} ETH</p>
							</div>
							<div className="flex items-center justify-between gap-4">
								<p >JCOL Value: </p>
								<p className="text-white font-bold">{totalCollateral && readCurrentPrice
									? formatNumber((Number(totalCollateral) * formatEther(Number(readCurrentPrice)))) : 0} JCOL</p>
							</div>
						</div>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full py-6 px-4 rounded-[10px] flex flex-col items-start justify-start gap-4'>
						<p className='text-xl font-bold flex items-center justify-center gap-2'>
							<FaHandHoldingUsd className="text-blue-400 text-3xl" />
							Borrow Operations
						</p>
						<div className="text-gray-400 bg-[#18212f] p-4 w-full flex flex-col gap-2 rounded-[10px]">
							<p>Amount (JSOL)</p>
							<input onChange={(e) => setBorrowRepay(e.target.value)} value={borrowRepay} type="number" className="bg-[#030712] outline-none border-[1px] border-[rgba(255,255,255,.2)] py-2 px-3 text-xl rounded-[10px]" placeholder="0" />
						</div>
						<div className="flex items-center justify-center w-full gap-4">
							<button className="bg-blue-400 text-[#04161a] flex items-center justify-center gap-3 py-2 px-3 w-full rounded-[10px] font-bold text-lg" onClick={handleBorrow}><FaArrowDown /> Borrow</button>
							<button className="bg-[#18212f] text-[#04161a] flex items-center justify-center gap-3 py-2 px-3 w-full rounded-[10px] font-bold text-lg text-white" onClick={handleRepay}><FaArrowUp /> Repay</button>
						</div>
						<div className="text-gray-400 bg-[#18212f] p-4 w-full flex flex-col gap-2 rounded-[10px]">
							<div className="flex items-center justify-between gap-4">
								<p>Total Borrowed: </p>
								<p className="text-blue-400 font-bold">{totalBorrowed ? formatNumber(totalBorrowed) : 0} JSOL</p>
							</div>
						</div>
					</div>
					<div className='bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full py-6 px-4 rounded-[10px] flex flex-col items-start justify-start gap-4'>
						<p className='text-xl font-bold flex items-center justify-center gap-2'>
							<IoMdSwap className="text-purple-500 text-3xl" />
							Swap Operations
						</p>
						<div className="text-gray-400 bg-[#18212f] p-4 w-full flex flex-col gap-2 rounded-[10px]">
							<p>From</p>
							<div className="grid gap-4" style={{ gridTemplateColumns: "1fr 90px" }}>
								<input onChange={(e) => setToken(e.target.value)} value={token} type="number" className="w-full bg-[#030712] outline-none border-[1px] border-[rgba(255,255,255,.2)] py-2 px-3 text-xl rounded-[10px]" placeholder="0" />
								<select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-[#030712] outline-none border-[1px] border-[rgba(255,255,255,.2)] py-2 px-3 rounded-[10px]">
									<option value="ETH" >ETH</option>
									<option value="JCOL">JCOL</option>
								</select>
							</div>
						</div>
						<div className="flex items-center justify-center w-full gap-4">
							<button className="bg-purple-500 text-white flex items-center justify-center gap-3 py-2 px-3 w-full rounded-[10px] font-bold text-lg" onClick={() => {
								if (from === "JCOL") {
									handleTokenToEth();
								} else {
									handleEthToToken();
								}
							}}><IoMdSwap /> Swap</button>
						</div>
						<div className="text-gray-400 bg-[#18212f] p-4 w-full flex flex-col gap-2 rounded-[10px]">
							<div className="flex items-center justify-between gap-4">
								<p>Exchange Rate: </p>
								<p className="text-purple-400 font-bold">1 ETH = {readCurrentPrice ? Number(formatEther(Number(readCurrentPrice))).toFixed(2) : 0} JSOL</p>
							</div>
						</div>
					</div>
				</div>
				<div className="bg-[#0a1621] border-[1px] border-[rgba(255,255,255,0.1)] w-full py-6 px-4 rounded-[10px] flex flex-col items-start justify-start gap-4 ">
					<p className='text-xl font-bold flex items-center justify-center gap-2'>
						<FaChartLine className="text-green-400 text-3xl" />
						User Position History
					</p>
					<UserPosition
						key={userPositionKey}
						refetchAll={refetchAll}
						setTotalCollateral={setTotalCollateral}
						setTotalBorrowed={setTotalBorrowed}
					/>
				</div>
				{/* <div className='grid grid-cols-4 gap-2 min-h-[300px]'>
					<div className='border-[1px] rounded-[10px] border-white w-full p-3'>
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
					<div className='border-[1px] rounded-[10px] border-white w-full p-3'>
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
					<div className='border-[1px] rounded-[10px] border-white w-full p-3'>
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
					<div className='border-[1px] rounded-[10px] border-white w-full p-3'>
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
				</div> */}
			</motion.div>
		</div>
	);
}
