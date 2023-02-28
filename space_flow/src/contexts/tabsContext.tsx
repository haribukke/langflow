import { createContext, useEffect, useState, useRef } from "react";
import { example } from "../data_assets/example";

type flow = {
	name: string;
	id: string;
	data: any;
	chat: Array<{ message: string; isSend: boolean }>;
};

type TabsContextType = {
	tabIndex: number;
	setTabIndex: (index: number) => void;
	flows: Array<flow>;
	removeFlow: (id: string) => void;
	addFlow: (flowData?: any) => void;
	updateFlow: (newFlow: flow) => void;
	incrementNodeId: () => number;
	downloadFlow: () => void;
	uploadFlow: () => void;
};

const TabsContextInitialValue = {
	tabIndex: 0,
	setTabIndex: (index: number) => {},
	flows: [],
	removeFlow: (id: string) => {},
	addFlow: (flowData?: any) => {},
	updateFlow: (newFlow: flow) => {},
	incrementNodeId: () => 0,
	downloadFlow: () => {},
	uploadFlow: () => {},
};

export const TabsContext = createContext<TabsContextType>(
	TabsContextInitialValue
);

let _ = require("lodash");

export function TabsProvider({ children }) {
	const [tabIndex, setTabIndex] = useState(0);
	const [flows, setFlows] = useState<Array<flow>>([]);
	const [id, setId] = useState(0);

	const newNodeId = useRef(0);
	function incrementNodeId() {
		newNodeId.current = newNodeId.current + 1;
		return newNodeId.current;
	}
	useEffect(() => {
		if (flows.length !== 0)
			window.localStorage.setItem(
				"tabsData",
				JSON.stringify({ tabIndex, flows, id, nodeId: newNodeId.current })
			);
	}, [flows, id, tabIndex, newNodeId]);

	useEffect(() => {
		let cookie = window.localStorage.getItem("tabsData");
		if (cookie) {
			let cookieObject = JSON.parse(cookie);
			setTabIndex(cookieObject.tabIndex);
			setFlows(cookieObject.flows);
			setId(cookieObject.id);
			newNodeId.current = cookieObject.nodeId;
		}
	}, []);

	function downloadFlow() {
		const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
			JSON.stringify(flows[tabIndex])
		)}`;
		const link = document.createElement("a");
		link.href = jsonString;
		link.download = `${flows[tabIndex].name}.json`;
		link.click();
	}
	//upload is always empty, don't know why
	function uploadFlow() {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = (e: Event) => {
			if ((e.target as HTMLInputElement).files[0].type === "application/json") {
				const file = (e.target as HTMLInputElement).files[0];
				file.text().then((text) => {
                    console.log(JSON.parse(text),"json from upload")
					addFlow(JSON.parse(text));
				});
			}
		};
		input.click();
	}

	function removeFlow(id: string) {
		setFlows((prevState) => {
			const newFlows = [...prevState];
			const index = newFlows.findIndex((flow) => flow.id === id);
			if (index >= 0) {
				if (index === tabIndex) {
					setTabIndex(flows.length - 2);
					newFlows.splice(index, 1);
				} else {
					let flowId = flows[tabIndex].id;
					newFlows.splice(index, 1);
					setTabIndex(newFlows.findIndex((flow) => flow.id === flowId));
				}
			}
			return newFlows;
		});
	}
	function addFlow(flow?: flow) {
		const data = flow?.data ? flow.data : null;
		let newFlow: flow = {
			name: flow ? flow.name : "flow" + id,
			id: id.toString(),
			data,
			chat: flow ? flow.chat : [],
		};
		setId((old) => old + 1);
		setFlows((prevState) => {
			const newFlows = [...prevState, newFlow];
			return newFlows;
		});
		setTabIndex(flows.length);
	}
	function updateFlow(newFlow: flow) {
		console.log(newFlow);
		setFlows((prevState) => {
			const newFlows = [...prevState];
			const index = newFlows.findIndex((flow) => flow.id === newFlow.id);
			if (index !== -1) {
				newFlows[index].data = newFlow.data;
				newFlows[index].name = newFlow.name;
				newFlows[index].chat = newFlow.chat;
			}
			return newFlows;
		});
	}

	return (
		<TabsContext.Provider
			value={{
				tabIndex,
				setTabIndex,
				flows,
				incrementNodeId,
				removeFlow,
				addFlow,
				updateFlow,
				downloadFlow,
				uploadFlow,
			}}
		>
			{children}
		</TabsContext.Provider>
	);
}