/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLang } from "../hooks/useLang";
import { WEN, globalContants } from "../libs/globalContants";
import { Coin, JsonObject } from "../libs/types";
import { formatAsset, formatAssetAmount, formatCurrency, formatPercent } from "../utils";
import appConfig from "../appConfig.json";
import { useLiquity } from "../hooks/LiquityContext";
import { Vault } from "../libs/Vault";

export const PositionLabel = ({ title, icon, value, amountDecimals, coin }: {
	title: string;
	icon: string;
	value: number;
	amountDecimals: number;
	coin: Coin;
}) => {
	return <div className="flex-column-align-left">
		<div
			className="description"
			style={{ whiteSpace: "nowrap" }}>
			{title}
		</div>

		<div className="flex-row-align-left">
			<img
				src={icon}
				width="24px" />

			<div className="flex-column-align-left">
				<div>{formatCurrency(value)}</div>

				<div className="label big">{formatAsset(amountDecimals, coin)}</div>
			</div>
		</div>
	</div>
};

export const TokenCard = ({ token, magmaData, onOpenVault, title, showIcon = true }: {
	token: Coin;
	magmaData: any;
	onOpenVault: (token: string) => void;
	title: string;
	showIcon: boolean;
}) => {
	const { t } = useLang();
	const { chainId } = useLiquity()
	const total = {
		collateral: magmaData?.entireSystemColl[token.symbol] || globalContants.BIG_NUMBER_0,
		debt: magmaData?.entireSystemDebt[token.symbol] || globalContants.BIG_NUMBER_0
	}
	const reserve = magmaData?.LUSD_GAS_COMPENSATION || globalContants.BIG_NUMBER_0;
	const price = magmaData?.price[token.symbol] || 0;
	const totalUtilizationRate = total.collateral.gt(reserve) ? total.debt.dividedBy(total.collateral.multipliedBy(price)).toNumber() : 0;
	const vault: Vault = magmaData?.vaults[token.symbol];

	const collateralAmountDecimals = vault?.collateral.shiftedBy(-token.decimals).toNumber() || 0;
	const collateralValue = collateralAmountDecimals * price;

	const debtAmountDecimals = vault?.debt.shiftedBy(-WEN.decimals).toNumber() || 0;

	const recoveryMode = magmaData?.recoveryMode[token.symbol];
	const appConfigConstants = (appConfig.constants as JsonObject)[String(chainId)];
	const CCR = magmaData?.CCR > 0 ? magmaData?.CCR : appConfigConstants.MAGMA_CRITICAL_COLLATERAL_RATIO;
	const MCR = magmaData?.MCR > 0 ? magmaData?.MCR : appConfigConstants.MAGMA_MINIMUM_COLLATERAL_RATIO;
	const appLiquidationPoint = recoveryMode ? CCR : appConfigConstants.appMCR;
	const availableWithdrawal = vault?.getAvailableWithdrawal(price, appLiquidationPoint) || globalContants.BIG_NUMBER_0;
	const availableWithdrawalDecimals = formatAssetAmount(availableWithdrawal, token.decimals);
	const availableWithdrawalValue = availableWithdrawalDecimals * price;

	const liquidationPoint = recoveryMode ? CCR : MCR;
	const borrowingRate = magmaData?.borrowingRateWithDecay[token.symbol] || 0;
	const appMMROffset = appConfigConstants.appMMROffset;
	const availableBorrow = vault?.getAvailabelBorrow(price, liquidationPoint, borrowingRate, appMMROffset) || globalContants.BIG_NUMBER_0;
	const availableBorrowDecimals = formatAssetAmount(availableBorrow, WEN.decimals);

	const handleOpenVault = () => {
		onOpenVault(token.symbol);
	};

	return <div className="card tokenCard">
		<div className="titleBar">
			<div className="tokenTitle">
				{showIcon && <img
					src={token.logo}
					width="40px" />}

				<h5>{(showIcon ? token.symbol + " " : "") + title}</h5>
			</div>

			<div className="scoreInTitlebar">
				<div className="description">{t("utilizationRate")}</div>
				<div className="value">{formatPercent(totalUtilizationRate)}</div>
			</div>
		</div>

		<div className="valuesGrid">
			<PositionLabel
				title={t("deposited")}
				icon={token.logo}
				value={collateralValue}
				amountDecimals={collateralAmountDecimals}
				coin={token} />

			<PositionLabel
				title={t("debt")}
				icon={WEN.logo}
				value={debtAmountDecimals}
				amountDecimals={debtAmountDecimals}
				coin={WEN} />

			<PositionLabel
				title={t("withdrawable")}
				icon={token.logo}
				value={availableWithdrawalValue}
				amountDecimals={availableWithdrawalDecimals}
				coin={token} />

			<PositionLabel
				title={t("borrowable")}
				icon={WEN.logo}
				value={availableBorrowDecimals}
				amountDecimals={availableBorrowDecimals}
				coin={WEN} />
		</div>

		<button
			className="secondaryButton fullWidth"
			onClick={handleOpenVault}>
			{t("manage")}
		</button>
	</div>
};