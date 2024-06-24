import { useMemo } from "react";
import { StabilityTransactionRecord } from "../libs/types";
import { Badge } from "../components/Badge";
import { BadgeType, WEN, globalContants } from "../libs/globalContants";
import { useLiquity } from "../hooks/LiquityContext";
import { formatNumber } from "../utils";

export const StabilityTransactionListItem = ({ data }: {
	data: StabilityTransactionRecord;
}) => {
	const { publicClient } = useLiquity();
	const theTime = useMemo(() => new Date(data.timestamp), [data.timestamp]);
	const date = theTime.toLocaleDateString();
	const time = theTime.getHours() + ":" + theTime.getMinutes();
	const amount = data.amount;

	return <a
		className="transactionListItem"
		href={publicClient?.chain?.blockExplorers?.default.url + "/tx/" + data.tx}
		target="_blank">
		<div
			className="flex-column-align-left"
			style={{ gap: "8px" }}>
			<div
				className="flex-row-align-left"
				style={{ alignItems: "flex-end" }}>
				<div>{date}</div>
				<div className="label smallLabel">{time}</div>
			</div>

			<Badge type={BadgeType[data.operation as keyof typeof BadgeType]} />
		</div>

		<div className="txValues">
			{amount !== 0 && <div>
				{Math.abs(amount).toFixed(2)}&nbsp;{WEN.symbol}
			</div>}

			{amount !== 0 && <div className="label smallLabel">
				{(amount < 0 ? "-" : "") + formatNumber(Math.abs(amount))}&nbsp;{globalContants.USD}
			</div>}
		</div>
	</a>
};