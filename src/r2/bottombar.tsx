import * as React from "react"
import {inject, observer, Provider} from "mobx-react"
import {Tab, Tabs, TabList, TabPanel} from "react-tabs"
import {Console, IConsoleProps} from "./console"
import {State} from "./state"
import {EvaluationView} from "../editor/evaluation-view"

const styles = require("./bottombar.scss")

export interface IBottombarProps {
    state?: State
    selectedIndex: number
    consoleProps: IConsoleProps & { ref?: (instance: Console) => any }
    onTabSelect: (index: number) => void
}

@inject("state") @observer
export class Bottombar extends React.Component<IBottombarProps, void> {
    render() {
        const {
            onTabSelect,
            selectedIndex,
            consoleProps,
            state
        } = this.props

        if (!state) {
            return null
        }

        const {editorStates, currentChannelId} = state

        const shortName = "#" + currentChannelId.slice(0, 12)

        const editorState = editorStates[currentChannelId]

        return <div className={styles.bottombar}>
            <div className={styles.tabs}>
                <Tabs onSelect={onTabSelect} selectedIndex={selectedIndex}>
                    <TabList>
                        <Tab>{shortName}</Tab>
                        <Tab>Changes</Tab>
                        <Tab>Output</Tab>
                    </TabList>

                    <TabPanel>
                        <Console {...consoleProps} />
                    </TabPanel>

                    <TabPanel>
                        TODO
                    </TabPanel>

                    <TabPanel>
                        <Provider editorState={editorState}>
                            <div className={styles.output}>
                                <EvaluationView />
                            </div>
                        </Provider>
                    </TabPanel>

                </Tabs>
            </div>
        </div>
    }
}
