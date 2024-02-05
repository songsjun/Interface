import { Langs, globalContants } from "./globalContants";
import appConfig from "../appConfig.json"
import { JsonObject } from "./types";
import { graphqlAsker } from "./graphqlAsker";

export const appController: {
	lang: Langs | null;
	worker?: Worker;
	init: () => void;
	detectLang: () => void;
	changeLang: (lng: Langs) => void;
	relaunch: () => void;
	employWorkers: (chainId: number, onDone?: () => void) => void;
	_dbConnector: IDBOpenDBRequest | undefined;
	_db: IDBDatabase | undefined;
	openDB: (chainId: number, onDone: () => void) => void;
	readAll: (onDone: (arg?: IDBCursor) => void) => void;
	getUserPoints: (chainId: number, user: string, referrer: string, onDone: (point: number) => void) => void;
	_getUserStabilityAndLpScore: (chainId: number, user: string, onDone: (res: Record<string, number>) => void) => void;
} = {
	_dbConnector: undefined,
	_db: undefined,
	lang: null,

	init: function () {
		this.detectLang();
	},

	detectLang: function () {
		if (!this.lang) {
			this.lang = window.localStorage.getItem(globalContants.APP_LANG) as Langs;
		}

		if (!this.lang) {
			this.lang = Langs.English;
		}
	},

	changeLang: function (lng: Langs) {
		this.lang = lng;
		window.localStorage.setItem(globalContants.APP_LANG, lng);
	},

	relaunch: function () {
		window.location.reload();
	},

	employWorkers: function (chainId, onDone?: () => void) {
		this.worker = new Worker("/workers/get-history.js", {
			type: "classic"
		});

		this.worker.addEventListener("message", e => {
			if (e.data === "openned") onDone && onDone();
			if (e.data === "fetched") this.worker?.terminate();
		});

		this.worker.addEventListener('error', err => {
			console.error(err);
		});

		this.worker.addEventListener('messageerror', err => {
			console.error(err);
		});

		this.worker.postMessage({
			cmd: "fetch",
			params: chainId
		});
	},

	openDB: function (chainId, onDone: () => void) {
		this._dbConnector = window.indexedDB.open("magma-db-" + chainId, 1);

		this._dbConnector.onerror = event => {
			console.error('数据库打开出错', event);
		};

		this._dbConnector.onsuccess = () => {
			this._db = this._dbConnector?.result;
			return onDone && onDone();
		};
	},

	readAll: function (onDone) {
		let objectStore = null;

		try {
			objectStore = this._db?.transaction("history", "readonly").objectStore("history");
		} catch (error) {
			console.warn(error);
		}

		if (objectStore) {
			objectStore.openCursor().onsuccess = (event) => {
				const cursor: IDBCursor = event.target.result;
				if (cursor) {
					return onDone && onDone(cursor);
				}
			};
		} else {
			return onDone && onDone();
		}
	},

	getUserPoints: function (chainId, user, referrer, onDone): void {
		// this._getUserStabilityAndLpScore(chainId, "0x91662cac85b19377cf73be58db6a72bbe3b16cd8", res => {
		this._getUserStabilityAndLpScore(chainId, user, res => {
			let myUsersPoints = 0;

			// 根据referrer取得用户的下线。
			// const query = graphqlAsker.requestUsersWithReferrer("0x");
			const query = graphqlAsker.requestUsersWithReferrer(referrer);
			graphqlAsker.ask(chainId, query, (result: any) => {
				if (result?.users) {
					const myUsers = result.users.map((item: { id: string; }) => '"' + item.id + '"');

					const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];

					const question = graphqlAsker.requestScoreOfUsers(myUsers);
					const stabilityScoreGraph = cfg?.stabilityScore;
					graphqlAsker.ask(
						chainId,
						question,
						(stabilityScoreRes: any) => {
							if (stabilityScoreRes?.users) {
								stabilityScoreRes?.users.forEach((element: any) => {
									myUsersPoints += Number(element.point.point);
								});
							}

							const lpScoreGraph = cfg?.lpScore;
							graphqlAsker.ask(
								chainId,
								question,
								(lpScoreRes: any) => {
									if (lpScoreRes?.users) {
										lpScoreRes.users.forEach((element: any) => {
											myUsersPoints += Number(element.point.point);
										});
									}

									return onDone && onDone(res.stabilityScore + res.lpScore + myUsersPoints * 0.1);
								},
								lpScoreGraph
							);
						},
						stabilityScoreGraph
					);
				}
			});
		});
	},

	_getUserStabilityAndLpScore: function (chainId: number, user: string, onDone) {
		const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];
		const query = graphqlAsker.requestUserScore(user);
		const res = {
			stabilityScore: 0,
			lpScore: 0
		};


		const getLPScore = () => {
			const lpScoreGraph = cfg?.lpScore;
			if (lpScoreGraph) {
				graphqlAsker.ask(
					chainId,
					query,
					(data: any) => {
						if (data.user) res.lpScore = Number(data.user.point.point);

						return onDone && onDone(res);
					},
					lpScoreGraph
				);
			} else {
				return onDone && onDone(res);
			}
		};

		const stabilityScoreGraph = cfg?.stabilityScore;
		if (stabilityScoreGraph) {
			graphqlAsker.ask(
				chainId,
				query,
				(data: any) => {
					if (data.user) res.stabilityScore = Number(data.user.point.point);
					getLPScore();
				},
				stabilityScoreGraph
			);
		} else {
			getLPScore();
		}
	}
};