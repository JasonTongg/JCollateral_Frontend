import "../styles/globals.css";
import Layout from "../layout/default";
import { Provider } from "react-redux";
import Store from "../store/store";
import "@rainbow-me/rainbowkit/styles.css";
import {
	getDefaultConfig,
	RainbowKitProvider,
	darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const local = {
	id: 31337,
	name: "Local Testnet",
	nativeCurrency: { name: "Local Network", symbol: "ETH", decimals: 18 },
	rpcUrls: {
		default: { http: ["http://127.0.0.1:8545/"] },
	},
	testnet: true,
};

const config = getDefaultConfig({
	appName: "My RainbowKit App",
	projectId: "0e50ad124798913a4af212355f956d06",
	chains: [sepolia],
	ssr: true,
});

const customTheme = {
	blurs: {
		modalOverlay: "6px",
	},
	colors: {
		accentColor: "#4ade80",
		accentColorForeground: "#000000",
		actionButtonBorder: "#182126",
		actionButtonBorderMobile: "#182126",
		actionButtonSecondaryBackground: "#182126",
		closeButton: "#5e6a5e",
		closeButtonBackground: "#04161a",
		connectButtonBackground: "#4ade80",
		connectButtonBackgroundError: "#4ade80",
		connectButtonInnerBackground: "#4ade80",
		connectButtonText: "#000000",
		connectButtonTextError: "#000000",
		connectionIndicator: "#26a17b",
		downloadBottomCardBackground: "#182126",
		downloadTopCardBackground: "#04161a",
		error: "#4ade80",
		generalBorder: "#182126",
		generalBorderDim: "#adad9b",
		menuItemBackground: "#182126",
		modalBackdrop: "rgba(0, 0, 0, 0.75)",
		modalBackground: "#04161a",
		modalBorder: "#182126",
		modalText: "#ffffff",
		modalTextDim: "#5e6a5e",
		modalTextSecondary: "#adad9b",
		profileAction: "#182126",
		profileActionHover: "#4ade80",
		profileForeground: "#04161a",
		selectedOptionBorder: "#4ade80",
		standby: "#4ade80",
	},
	fonts: {
		body: "",
	},
	radii: {
		actionButton: "8px",
		connectButton: "12px",
		menuButton: "4px",
		modal: "20px",
		modalMobile: "20px",
	},
	shadows: {
		connectButton: "",
		dialog: "0px 10px 20px rgba(0, 0, 0, 0.3)",
		profileDetailsAction: "0px 2px 5px rgba(0, 0, 0, 0.2)",
		selectedOption: "0px 0px 6px rgba(0, 255, 98, 0.6)",
		selectedWallet: "0px 0px 10px rgba(0, 255, 42, 0.8)",
		walletLogo: "0px 2px 4px rgba(0, 0, 0, 0.2)",
	},
};

function MyApp({ Component, pageProps }) {
	const queryClient = new QueryClient();
	return (
		<Provider store={Store}>
			<WagmiProvider config={config}>
				<QueryClientProvider client={queryClient}>
					<RainbowKitProvider theme={customTheme} coolMode={true}>
						<Layout>
							<Component {...pageProps} />
						</Layout>
					</RainbowKitProvider>
				</QueryClientProvider>
			</WagmiProvider>
		</Provider>
	);
}

export default MyApp;
