import { useMemo } from "react";
import { Coin, TroveChangeTx, TroveOperation } from "../libs/types";
import { Badge } from "../components/Badge";
import { BadgeType, WEN, globalContants } from "../libs/globalContants";
import { Decimal } from "lib-base";
import { useChainId, usePublicClient } from "wagmi";

export const TransactiionListItem = ({
	data,
	market,
	price = Decimal.ONE
}: {
	data: TroveChangeTx;
	market: Coin;
	price: Decimal;
}) => {
	const chainId = useChainId();
	const client: PublicClient = usePublicClient({ chainId });
	const theTime = useMemo(() => new Date(data.transaction.timestamp * 1000), [data.transaction.timestamp]);
	const date = theTime.toLocaleDateString();
	const time = theTime.getHours() + ":" + theTime.getMinutes();
	const col = Number(data.collateralChange);
	const deb = Number(data.debtChange);
	const badgeTypes = useMemo(() => {
		const type: BadgeType[] = [];

		switch (data.troveOperation) {
			case TroveOperation.OpenTrove:
			case TroveOperation.AdjustTrove:
				if (col > 0) {
					type.push(BadgeType.Deposit);
				}

				if (col < 0) {
					type.push(BadgeType.Withdraw);
				}

				if (deb > 0) {
					type.push(BadgeType.Borrow);
				}

				if (deb < 0) {
					type.push(BadgeType.Repay);
				}

				break;

			default:
				// type = [data.troveOperation as string as BadgeType];
				break;
		}

		return type;
	}, [col, data.troveOperation, deb]);

	return <a
		className="flex-row-space-between"
		style={{ cursor: "pointer" }}
		href={client.chain?.blockExplorers?.default.url + "/tx/" + data.transaction.id}
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

			{badgeTypes && <div className="flex-row-align-left">
				{badgeTypes.map(badge => {
					return <Badge type={badge} />
				})}
			</div>}
		</div>

		<div className="flex-column-align-right">
			<div className="flex-row-align-left">
				{col !== 0 && <div style={{ color: col > 0 ? "#F25454" : "#8ED434" }}>
					{Math.abs(col)}&nbsp;{market.symbol}
				</div>}

				{deb !== 0 && <div style={{ color: deb > 0 ? "#F25454" : "#8ED434" }}>
					{Math.abs(deb)}&nbsp;{WEN.symbol}
				</div>}
			</div>

			<div className="flex-row-align-left">
				{col !== 0 && <div className="label smallLabel">
					{(col < 0 ? "-" : "") + price.mul(Math.abs(col)).shorten()}&nbsp;{globalContants.USD}
				</div>}

				{deb !== 0 && <div className="label smallLabel">
					{(deb < 0 ? "-" : "") + price.mul(Math.abs(deb)).shorten()}&nbsp;{globalContants.USD}
				</div>}
			</div>
		</div>
	</a>
};