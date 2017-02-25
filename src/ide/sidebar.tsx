const debug = require("debug")("evan:ide:sidebar")
import * as React from "react"
import {inject, observer} from "mobx-react"
import {IConnectionStatus, IActivity, State} from "./state"
import {STATUS} from "./util"

const styles = require("./sidebar.scss")

export type ISidebarProps = {
    state?: State
    onSelect: (channel: string) => void
}

@inject("state") @observer
export class Sidebar extends React.Component<ISidebarProps, void> {
    handleClick = (e: any) => {
        e.preventDefault()
        const {onSelect} = this.props
        const el = (e.target as HTMLElement)
        const c = (el.dataset as any).channel // TODO: type some day
        debug("select: %s", c)
        if (onSelect) {
            onSelect(c) // TODO: this throws sometimes. make sure it is the right target (anchor)
        }
    }

    render() {
        const {state} = this.props

        if (!state) {
            return null
        }

        return <div className={styles.sidebar}>
        {
            state.channels.map(channel => {
                const activity = state.activity[channel]
                const connectionStatus = state.connectionStatus[channel]
                const {currentChannelId} = state
                let anchorClassName = ""

                if (channel === currentChannelId) {
                    anchorClassName = styles.current
                } else if (activity !== IActivity.None) {
                    anchorClassName = activity === IActivity.Mentioned
                        ? styles.mentioned
                        : styles.activity
                }

                return <div key={channel} className={styles.channel}>
                    <a onClick={this.handleClick} className={anchorClassName} data-channel={channel}>
                        { channel !== STATUS ? "#" + channel : channel }
                        {
                            (connectionStatus === IConnectionStatus.Connected)
                            ? <span className={styles.star}>*</span>
                            : null
                        }
                    </a>
                </div>
            })
        }
        </div>
    }
}
