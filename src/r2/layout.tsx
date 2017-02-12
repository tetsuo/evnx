const ReactFlexLayout = require("react-flex-layout")
const FlexLayout = ReactFlexLayout.Layout
const FlexLayoutSplitter = ReactFlexLayout.LayoutSplitter
import * as React from "react"
import {inject, observer} from "mobx-react"
import {Sidebar} from "./sidebar"
import {Console} from "./console"
import {Bottombar} from "./bottombar"
import {Modeler} from "./modeler"
import {STATUS, NONE} from "./util"
import {State} from "./state"

const styles = require("./layout.scss")

const SIDEBAR_WIDTH = 340
const BOTTOM_TAB_INDEX = 0

export interface ILayoutProps {
    state: State
    onTabSelect: (index: number) => void
    onSidebarSelect: (channel: string) => void
    onCommandLine: (msg: string) => void
}

@inject("state") @observer
export class Layout extends React.Component<ILayoutProps, void> {
    render() {
        const {
            state,
            onSidebarSelect,
            onCommandLine,
            onTabSelect
        } = this.props

        const {currentChannelId} = state

        if (currentChannelId === NONE) {
            return null
        }

        return (
            <FlexLayout fill="window">

                <FlexLayout layoutWidth={SIDEBAR_WIDTH}>
                    <Sidebar onSelect={onSidebarSelect} />
                </FlexLayout>

                <FlexLayoutSplitter />

                <FlexLayout layoutWidth="flex">
                    <div className={styles.content}>
                    {
                        (currentChannelId === STATUS)

                        ? <Console onInput={onCommandLine} />

                        : <FlexLayout containerHeight={window.innerHeight}>
                            <FlexLayout layoutHeight="flex">
                                <Modeler />
                            </FlexLayout>
                            <FlexLayoutSplitter />
                            <FlexLayout layoutHeight={360}>
                                <Bottombar
                                    onTabSelect={onTabSelect}
                                    selectedIndex={BOTTOM_TAB_INDEX}
                                    consoleProps={{ onInput: onCommandLine }}
                                />
                            </FlexLayout>
                        </FlexLayout>
                    }
                    </div>
                </FlexLayout>

            </FlexLayout>
        )
    }
}
