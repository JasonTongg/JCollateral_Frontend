import { configureStore } from "@reduxjs/toolkit";
import data from "./data";
import JCOL_ABI from "./abi/JCOL";
import JCOLDEX_ABI from "./abi/JCOLDEX";
import Lending_ABI from "./abi/Lending";
import MovePrice_ABI from "./abi/MovePrice";

let store = configureStore({
	reducer: {
		data,
		abi: {
			JCOL_ABI,
			JCOLDEX_ABI,
			Lending_ABI,
			MovePrice_ABI,
		},
	},
});

export default store;
