import * as React from "react"
import {
    inject,
    observer
} from "mobx-react"
import {computed} from "mobx"
import strftime = require("strftime")
import {State, ILogDataKind, ILogData} from "./state"
import {STATUS} from "./util"
import {ILog} from "../net/swarm"

const styles = require("./console.scss")

const LINK_PATTERN = RegExp("((?:https?:|magnet:|ssb:|/ipfs/)\\S+)")
const LINK_PART_PATTERN = RegExp("^" + LINK_PATTERN.source)

export type IMessageLog = ILog<ILogData>

export type IConsoleProps = {
    state?: State
    onInput: (msg: string) => void
}

@inject("state") @observer
export class Console extends React.Component<IConsoleProps, void> {
    input: HTMLInputElement
    lines: HTMLDivElement

    @computed get rows(): IMessageLog[] {
        const {state} = this.props
        if (!state) {
            return []
        }

        const {
            logs,
            currentChannelId
        } = state

        if (!logs.hasOwnProperty(currentChannelId)) {
            return []
        }

        return logs[currentChannelId]
            .filter(d => d.data.kind === ILogDataKind.Message ||
                         d.data.kind === ILogDataKind.Info)
    }

    @computed get peers(): string[] {
        const {state} = this.props
        if (!state) {
            return []
        }

        const {
            peers,
            currentChannelId
        } = state

        return peers[currentChannelId]
    }

    handleSubmit = (e: any) => {
        e.preventDefault()

        const input: HTMLInputElement = this.input

        const {onInput} = this.props
        if (onInput) {
            onInput(input.value)
        }

        input.value = ""
    }

    adjustScroll() {
        const {lines} = this
        lines.scrollTop = (lines.scrollHeight - lines.clientHeight)
    }

    componentDidMount() {
        this.adjustScroll()
    }

    componentDidUpdate() {
        this.adjustScroll()
    }

    render() {
        const {state} = this.props

        if (!state) {
            return null
        }

        const {
            rows,
            peers
        } = this

        const {
            user,
            currentChannelId
        } = state

        return <div className={styles.console}>
                    <div className={styles.lines} ref={(d) => this.lines = d}>
                        { rows.map((row, i) => printRow(row, `log-${i}`)) }
                    </div>

                    <div className={styles.cmdline}>
                        <div className={styles.status}>
                            <span>{`[${strftime("%T", new Date)}]`}</span>
                            <span>{`[${user}]`}</span>
                            <span>{`[${currentChannelId}]`}</span>
                            {
                                currentChannelId !== STATUS
                                    ? <span>{`[${(peers || []).length} peers]`}</span>
                                    : null
                            }
                        </div>
                        <form className={styles.input} onSubmit={this.handleSubmit}>
                            <input
                                ref={(d) => this.input = d}
                                type="text" name="text"
                                autoFocus
                                autoComplete="off" />
                        </form>
                    </div>
        </div>
    }
}

export function printRow(row: IMessageLog, key: string) {
    const time = strftime("%T", new Date(row.time))
    const parts = row.data.msg.split(LINK_PATTERN)

    const wrapperClassNames = [styles.line]
    if (row.data.kind === ILogDataKind.Info) {
        wrapperClassNames.push(styles.info)
    }

    return <div className={wrapperClassNames.join(" ")} key={key}>
        <span className={styles.time}>{time}</span>
        <span className={styles.user}>{`<${row.user}>`}</span>
        <span className={styles.message}>
            {
                parts.map(part => {
                    return LINK_PART_PATTERN.test(part)
                        ? <a href={`${part}`} key={`${key}-${part}`}>{part}</a>
                        : part
                })
            }
        </span>
    </div>
}
