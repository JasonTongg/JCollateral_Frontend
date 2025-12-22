const abi = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_cornDex",
				type: "address",
			},
			{
				internalType: "address",
				name: "_cornToken",
				type: "address",
			},
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		stateMutability: "payable",
		type: "fallback",
	},
	{
		inputs: [
			{
				internalType: "int256",
				name: "size",
				type: "int256",
			},
		],
		name: "movePrice",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		stateMutability: "payable",
		type: "receive",
	},
];

export default abi;
