/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useEffect, useState } from "react";
import { useLang } from "../hooks/useLang";
import { Coin } from "../libs/types";
import { PoolView } from "./PoolView";
import { magma } from "../libs/magma";
import { TokenStakedCard } from "./TokenStakedCard";
import { useSearchParams } from "react-router-dom";

export const StakeView = ({ refreshTrigger, magmaData }: {
	refreshTrigger: () => void;
	magmaData?: Record<string, any>;
}) => {
	const { t } = useLang();
	const tokens = Object.values(magma.tokens) || [];
	const [magmaDataForSingleToken, setMagmaDataForSingleToken] = useState<Record<string, any>>();
	const [currentMarket, setCurrentMarket] = useState<Coin>();
	const [searchParams] = useSearchParams();
	const tokenArg = searchParams.get("token")

	const readyForOpenningMarket = (token: string) => {
		setCurrentMarket(magma.tokens[token]);

		setMagmaDataForSingleToken({
			...magmaData,
			price: magmaData?.price[token],
			vaultsCount: magmaData?.vaultsCount[token],
			borrowingRateWithDecay: magmaData?.borrowingRateWithDecay[token],
			stabilityDeposit: magmaData?.stabilityDeposit[token],
			lusdInStabilityPool: magmaData?.lusdInStabilityPool[token],
			entireSystemColl: magmaData?.entireSystemColl[token],
			TVL: magmaData?.TVL[token],
			entireSystemDebt: magmaData?.entireSystemDebt[token],
			recoveryMode: magmaData?.recoveryMode[token],
			vault: magmaData?.vaults[token],
			balance: magmaData?.balance[token]
		});
	};

	useEffect(() => {
		if (currentMarket && magmaDataForSingleToken && magmaData) {
			readyForOpenningMarket(currentMarket.symbol);
		}

		setTimeout(() => {
			if (magmaData && tokenArg && tokens?.length > 0 && tokens.findIndex(item => item.symbol === tokenArg) >= 0) {
				readyForOpenningMarket(tokenArg);
			}
		}, 1000);
	}, [magmaData])

	const handleOpenPool = (token: string) => {
		readyForOpenningMarket(token);
	};

	const handleGoBack = () => {
		setCurrentMarket(undefined);
		setMagmaDataForSingleToken(undefined);
	};

	return <div className="mainContainer">
		{!magmaDataForSingleToken && <>
			<div className="titleBox">
				<img
					className="viewIcon"
					src="images/stake.png" />

				<h1>{t("stabilityPool")}</h1>
			</div>

			<div className="vaultList">
				{tokens.map(token => {
					return <TokenStakedCard
						key={token.symbol}
						token={token}
						magmaData={magmaData}
						onOpenPool={handleOpenPool}
						title={t("stabilityPool")} 
						showIcon={true} />
				})}
			</div>
		</>}

		{currentMarket && magmaDataForSingleToken && <>
			<button
				className="textButton"
				onClick={handleGoBack}>
				<img
					src="/images/back.png"
					width="20px" />

				{t("back")}
			</button>

			{/* <MarketView
				market={currentMarket}
				externalDataDone={externalDataDone}
				magmaData={magmaDataForSingleToken}
				refreshTrigger={refreshTrigger} /> */}
			<PoolView
				market={currentMarket}
				magmaData={magmaDataForSingleToken}
				refreshTrigger={refreshTrigger} />
		</>}
	</div>
};