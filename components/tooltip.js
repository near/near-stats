import React from "react";
import styles from '../styles/tooltip.module.scss'
import * as d3 from "d3";

// define tooltip for barChart
function Tooltip({ visible, data, x, y }) {

    const tooltipRef = React.useRef();

    let html = ""

    // set inner html
    for (const [key, value] of Object.entries(data)) {
        html += `<div><strong>${key}</strong>${value != "" ? ": " + value : ""}</div>`
    }

    React.useEffect(() => {
        // set tooltip location
        const tooltip = d3.select(tooltipRef.current)

        // define tooltip 
        tooltip
            .html(html)
            .style("left", (x + 50) + "px")
            .style("top", y + "px")
            .style("opacity", visible == true ? 1 : 0)

    })

    return (
        <React.Fragment>
            <div ref={tooltipRef} className={styles.tooltip}>
            </div>
        </React.Fragment>
    );

}

export default Tooltip;