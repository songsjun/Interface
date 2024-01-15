/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { OptionItem } from "../libs/types";
import { useLang } from "../hooks/useLang";

let dropdownMenuTimer: NodeJS.Timeout | null = null;

export const DropdownMenu = ({
	defaultValue = 0,
	options = [],
	onChange = () => { },
	children = null,
	showArrows = false,
	alignTop = false,
	forcedClass = ""
}: {
	defaultValue?: number;
	options: OptionItem[];
	onChange: (idx: number) => void;
	children: ReactNode;
	showArrows: boolean;
	alignTop: boolean;
	forcedClass: string
}) => {
	const { t } = useLang();
	const [idx, setIdx] = useState(defaultValue);
	const currentOption = options[idx];
	const [expanded, setExpanded] = useState(false);

	const handleExpand = () => {
		if (options.length >= 1) {
			setExpanded(!expanded);
		}
	};

	const handleClickOption = (evt: MouseEvent) => {
		const val = parseInt(evt.currentTarget.id);
		setIdx(val);
		onChange(val);
		setExpanded(false);
	};

	const clearTimer = () => {
		if (dropdownMenuTimer) {
			clearTimeout(dropdownMenuTimer!);
			dropdownMenuTimer = null;
		}
	};

	const setTimer = useCallback(() => {
		if (expanded) {
			dropdownMenuTimer = setTimeout(() => {
				setExpanded(false);
			}, 1000);
		}
	}, [expanded]);

	const handleMouseEnter = () => {
		clearTimer();
	};

	const handleMouseLeave = () => {
		setTimer();
	};

	const renderArrows = !expanded ? <img
		className="arrow"
		src="images/arrow-down.png" /> : <img
		className="arrow"
		src="images/arrow-up.png" />

	return <div>
		<div
			className={forcedClass ?? "dropdownMenu"}
			onClick={handleExpand}>
			{children && <>
				{children}
				{showArrows && renderArrows}
			</>}

			{!children && <>
				{currentOption.icon && <div
					className="icon"
					style={{ backgroundImage: "url(" + currentOption.icon + ")" }} />}

				<div>{currentOption.title ?? t(currentOption.key!)}</div>

				{options.length > 2 && renderArrows}
			</>}
		</div>

		<div style={{ position: "relative" }}>
			{expanded && <div
				className="dropdownMenuOptions"
				onMouseLeave={handleMouseLeave}
				onMouseEnter={handleMouseEnter}
				style={{
					top: alignTop ? "0" : "auto",
					bottom: alignTop ? "auto" : "0",
					right: "0",
					left: "auto"
				}}>
				{options.map((option, index) => {
					return <div
						key={option.title || option.key}
						id={String(index)}
						className={"option" + (idx === index ? " active" : "")}
						onClick={handleClickOption}>
						{option.icon && <img src={option.icon} />}

						<div>{option.title ?? t(option.key!)}</div>
					</div>
				})}
			</div>}
		</div>
	</div>
}