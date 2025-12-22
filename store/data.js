import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { storyTestnet } from "viem/chains";
import JCOL_ABI from "./abi/JCOL";
import JCOLDEX_ABI from "./abi/JCOLDEX";
import Lending_ABI from "./abi/Lending";
import MovePrice_ABI from "./abi/MovePrice";

// Initial state
const initialState = {
	address: "0x0000000000000000000000000000000000000000",
	abi: {
		JCOL_ABI,
		JCOLDEX_ABI,
		Lending_ABI,
		MovePrice_ABI,
	},
};

// Create the slice
const datas = createSlice({
	name: "Datas",
	initialState,
	reducers: {
		setAddress: (state, action) => {
			state.address = action.payload;
		},
	},
});

// Export the reducer
export const { setAddress } = datas.reducer;
export default datas.reducer;
