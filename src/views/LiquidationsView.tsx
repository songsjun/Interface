/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useLang } from "../hooks/useLang";
import { RiskyTroves } from "../components/RiskyTroves";

export const LiquidationsView = ({ magmaData, refreshTrigger }: {
	magmaData?: Record<string, any>;
	refreshTrigger: () => void;
}) => {
	const { t } = useLang();

	return <div className="mainContainer">
		<div className="titleBox">
			<img
				className="viewIcon"
				src="images/liquidations.png" />

			<h1>{t("liquidations")}</h1>
		</div>

		<RiskyTroves
			pageSize={10}
			magmaData={magmaData}
			refreshTrigger={refreshTrigger} />
	</div>
};