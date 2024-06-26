/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLang } from "../hooks/useLang";
import { MAGMA, WEN, globalContants } from "../libs/globalContants";
import { Coin, StabilityDeposit } from "../libs/types";
import { formatAssetAmount } from "../utils";
import { PositionLabel } from "./TokenCard";

export const TokenStakedCard = ({ token, magmaData, onOpenPool, title, showIcon = true }: {
	token: Coin;
	magmaData: any;
	onOpenPool: (token: string) => void;
	title: string;
	showIcon: boolean;
}) => {
	const { t } = useLang();
	const price = magmaData?.price[token.symbol] || 0;
	const stabilityDeposit = magmaData?.stabilityDeposit[token.symbol];
	const stakedDecimals = formatAssetAmount(stabilityDeposit?.currentLUSD || globalContants.BIG_NUMBER_0, WEN.decimals);
	const lqtyRewardDecimals = formatAssetAmount(stabilityDeposit?.lqtyReward || globalContants.BIG_NUMBER_0, MAGMA.decimals);

	const rewardsFromCollateralDecimals = formatAssetAmount(stabilityDeposit?.collateralGain || globalContants.BIG_NUMBER_0, WEN.decimals);
	const rewardsFromCollateralValue = rewardsFromCollateralDecimals * price;

	const handleOpenPool = () => {
		onOpenPool(token.symbol);
	};

	return <div className="card tokenCard">
		<div className="titleBar">
			<div className="tokenTitle">
				{showIcon && <img
					src={token.logo}
					width="40px" />}

				<h5>{(showIcon ? token.symbol + " " : "") + title}</h5>
			</div>
		</div>

		<div className="valuesGrid">
			<PositionLabel
				title={t("staked")}
				icon={WEN.logo}
				value={stakedDecimals}
				amountDecimals={stakedDecimals}
				coin={WEN} />

			<PositionLabel
				title={t("magmaRewards")}
				icon={MAGMA.logo}
				value={0}
				amountDecimals={lqtyRewardDecimals}
				coin={MAGMA} />

			<PositionLabel
				title={t("rewardsFromCollateral")}
				icon={token.logo}
				value={rewardsFromCollateralValue}
				amountDecimals={rewardsFromCollateralDecimals}
				coin={token} />
		</div>

		<button
			className="secondaryButton fullWidth"
			onClick={handleOpenPool}>
			{t("manage")}
		</button>
	</div>
};