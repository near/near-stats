import React from "react";
import * as d3 from "d3";
import numeral from "numeral";


function BrushedAreaChart({ data = [], prediction_data = [], x = '_x', y = '_y', compare = 30, goals = [2000000], selection }) {

    const svgRef = React.useRef();

    const margin = {
        left: 110,
        right: 70,
        top: 20,
        bottom: 50
    }

    // base width & height. All other calculations based on this value
    const svgWidth = 700
    const svgHeight = 300

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right

    // // helpers for number formatting 
    // const precision = d3.precisionPrefix(1e5, 1.3e6);
    // const formatter = d3.formatPrefix("." + precision, 1.3e6);

    // will be called initially and on every data change
    React.useEffect(() => {
        
        // data extents
        let dateExtent = d3.extent(data, d => new Date(d[x]));
        let growthStart = d3.timeDay.offset(dateExtent[1], -compare);
        let growthStartValue = data.find(d => new Date(d[x]) >= growthStart)[y]
        let growthEndValue = data[data.length - 1][y]
        let percentChange = (growthEndValue - growthStartValue) / growthStartValue
        let xAxisMax = d3.timeDay.offset(dateExtent[1], 90)
        let prediction = prediction_data[prediction_data.length - 1][y]

        // set d3 references
        const svg = d3.select(svgRef.current)
        const svgContent = svg.select(".content");
        const svgNoClip = svg.select(".non-clip-content");

        // time scale for X axis
        const xScale = d3.scaleTime()
            .range([0, width])
            .domain(selection)

        // Linear scale for counts
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, prediction])


        // generator for svg path
        const lineGenerator = d3.line()
            .x(d => xScale(new Date(d[x])))
            .y(d => yScale(d[y]))
            .curve(d3.curveMonotoneX)

        // Generators svg area
        const areaGenerator = d3.area()
            .x(d => xScale(new Date(d[x])))
            .y0(d => yScale(0))
            .y1(d => yScale(d[y]))
            .curve(d3.curveMonotoneX)

        // draw area graph for current data
        svgContent
            .selectAll(".current-area")
            .data([data])
            .join("path")
            .attr("class", "current-area")
            .attr("stroke", "none")
            .attr("fill", "url(#gradient)")
            .attr("d", areaGenerator);

        // draw area graph for prediction data
        svgContent
            .selectAll(".prediction-area")
            .data([prediction_data])
            .join("path")
            .attr("class", "prediction-area")
            .attr("stroke", "none")
            .attr("fill", "url(#gradient)")
            .attr("fill-opacity", 0.5)
            .attr("d", areaGenerator);

        // draw line for prediction data
        svgContent
            .selectAll(".predict-data-line")
            .data([prediction_data])
            .join("path")
            .attr("class", "predict-data-line")
            .attr("stroke", "#A066B5")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", 4)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("d", lineGenerator);

        // draw line for current data
        svgContent
            .selectAll(".current-data-line")
            .data([data])
            .join("path")
            .attr("class", "current-data-line")
            .attr("stroke", "#A066B5")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("d", lineGenerator);

        // Tooltip
        // create tooltip
        var tooltip = svgContent.append("g")
            .attr("class", "area-tooltip")
            .style("display", "none");

        // draw indicator circle
        tooltip.append("circle")
            .attr("r", 5)
            .attr('fill','#A066B5');

        // draw tooltip box
        tooltip.append("rect")
            .attr('class',"tooltip-box")
            .attr("x", 9)
            .attr("y", -23)
            .attr("height",25)
            .attr('rx','5px');

        // add tooltip text
        tooltip.append("text")
            .attr("x", 15)
            .attr("dy", "-.35em")
            .style("font-size",15);

        // draw box for hovering
        svgContent.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style('fill','none')
            .style('pointer-events','all')
            .on("mouseover", function() {
                tooltip.style("display", null);
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            })
            .on("mousemove", mousemove);


        // format tooltip value
        function formatNumbers (value, decimals = 1) {
            // Nine Zeroes for Billions
            return Math.abs(Number(value)) >= 1.0e+9
            ? (Math.abs(Number(value)) / 1.0e+9).toFixed(2) + "B"

            // Six Zeroes for Millions 
            : Math.abs(Number(value)) >= 1.0e+6
            ? (Math.abs(Number(value)) / 1.0e+6).toFixed(decimals) + "M"

            // Three Zeroes for Thousands
            : Math.abs(Number(value)) >= 1.0e+3
            ? (Math.abs(Number(value)) / 1.0e+3).toFixed(0) + "K"
        
            : Math.abs(Number(value));
        }

        // transform tooltip placement and text based on hover position
        function mousemove(event) {
            
            var hover_date = xScale.invert(d3.pointer(event)[0])

            var data_point = data.find( ({ collected_for_day }) => collected_for_day.split('T')[0] === hover_date.toISOString().split('T')[0] );

            if (data_point){
            var y_value=parseFloat(data_point['total_accounts']);
            tooltip.attr("transform", "translate(" + xScale(new Date(data_point.collected_for_day)) + "," + yScale(y_value)+ ")"); 
            tooltip.select("text").text(formatNumbers(y_value,2));
            tooltip.select("rect").attr('width',tooltip.select("text").node().getComputedTextLength()+12)
            }

        }

        // comparison period highlight
        // draw growth highlight box
        svgContent
            .selectAll(".growth-bar")
            .data([0])
            .join('rect')
            .attr('x', xScale(growthStart))
            .attr('y', 0)
            .attr('height', height)
            .attr('width', xScale(dateExtent[1]) - xScale(growthStart))
            .attr("class", "growth-bar")
            .attr("stroke", "none")
            .attr("fill", "rgba(117, 117, 117, 0.4)")
            .attr("opacity", 0.1)

        // add growth highlight label
        svgContent
            .selectAll(".growth-text")
            .data([0])
            .join('text')
            .attr('x', xScale(d3.mean([dateExtent[1], growthStart])))
            .attr('y', yScale(growthEndValue) - 20)
            .text(Math.floor(percentChange * 100) + '%')
            .attr('class', 'growth-text')
            .attr('font-size', '0.7em')
            .attr('text-anchor', 'middle')

        // Goal Lines
        // draw current line
        svgContent
            .selectAll(".current-line")
            .data([0])
            .join('line')
            .attr('x1', xScale(dateExtent[0]))
            .attr('y1', yScale(growthEndValue))
            .attr('x2', xScale(dateExtent[1]))
            .attr('y2', yScale(growthEndValue))
            .attr('class', 'current-line')
            .attr('stroke', "rgba(117, 117, 117, 0.2)")

        // goals
        const goal_list=[]
        goals.forEach(g => 
            goal_list.push(numeral(g)._value)
            )
        // draw goal lines
        svgContent
            .selectAll(".goal-line")
            .data(goal_list)
            .join('line')
            .attr('x1', xScale(dateExtent[0]))
            .attr('y1', d => yScale(d))
            .attr('x2', xScale(xAxisMax))
            .attr('y2', d => yScale(d))
            .attr('class', 'goal-line')
            .attr('stroke-dasharray', 4)
            .attr('stroke', "rgba(117, 117, 117, 0.2)")

        // draw current label box
        svgNoClip
            .selectAll(".current-label-box")
            .data([0])
            .join('rect')
            .attr('x', -60)
            .attr('y', yScale(growthEndValue) - 10)
            .attr('width', 60)
            .attr('height', 20)
            .attr('rx', 10)
            .attr("class", "current-label-box")
            .attr("stroke", "#A066B5")
            .attr("stroke-width", 2)
            .attr("fill", "none")

        // add current label text
        svgNoClip
            .selectAll(".current-label-text")
            .data([0])
            .join('text')
            .attr('x', -30)
            .attr('y', yScale(growthEndValue))
            .text('Current')
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('class', 'current-label-text')
            .attr('fill', '#A066B5')
            .attr('font-size', '0.7em')

        // add current label value text
        svgNoClip
            .selectAll(".current-value-text")
            .data([0])
            .join('text')
            .attr('x', -70)
            .attr('y', yScale(growthEndValue))
            .text(formatNumbers(growthEndValue))
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'end')
            .attr('class', 'current-value-text')
            .attr('font-size', '0.7em')

        // draw goal label boxes
        svgNoClip
            .selectAll(".goal-label-box")
            .data(goal_list)
            .join('rect')
            .attr('x', -60)
            .attr('y', d => yScale(d) - 10)
            .attr('width', 60)
            .attr('height', 20)
            .attr('rx', 10)
            .attr("class", "goal-label-box")
            .attr("stroke", "#A066B5")
            .attr("stroke-width", 2)
            .attr("fill", "none")

        // add goal labels text
        svgNoClip
            .selectAll(".goal-label-text")
            .data(goal_list)
            .join('text')
            .attr('x', -30)
            .attr('y', d => yScale(d))
            .text('Goal')
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'middle')
            .attr('class', 'current-label-text')
            .attr('fill', '#A066B5')
            .attr('font-size', '0.7em')

        // add goal label values text
        svgNoClip
            .selectAll(".goal-value-text")
            .data(goal_list)
            .join('text')
            .attr('x', -70)
            .attr('y', d => yScale(d))
            .text(d => formatNumbers(d))
            .attr('dominant-baseline', 'middle')
            .attr('text-anchor', 'end')
            .attr('class', 'current-value-text')
            .attr('font-size', '0.7em')

        // axes
        // define x-axis
        const xAxis = d3.axisBottom(xScale).ticks(3);

        // draw x-axis
        svg
            .select(".x-axis")
            .attr("transform", `translate(0, ${height})`)
            .attr('font-family', 'manrope')
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick line").remove())

        // define y-axis
        const yAxis = d3.axisRight(yScale).ticks(4);

        // draw y-axis
        svg
            .select(".y-axis")
            .attr("transform", "translate("+width+",0)")
            .call(yAxis)
            .attr('font-family', 'manrope')
            .attr('font-size', '0.7em')
            .call(g => g.selectAll(".tick>line").remove())
            .call(g => g.select(".domain").remove());

        // load the watermark in as data
        d3.xml("/images/logo_nm.svg").then(watermark => {

            // use d3 join to ensure that additional watermarks are not continuously added.
            svg
            .selectAll('.watermark')
            .data([0])
            .join('g')
            .html('') // need to empty the group as React does not play well with append.
            .attr('class','watermark watermark-top')
            .node()
            .append(watermark.documentElement);

            // set attributes of watermark
            d3.selectAll('.watermark-top svg')
            .attr("y", 40)
            .attr("x",125)
            .attr("height",20*1.5)
            .attr("width",76*1.5)
            .attr('opacity', 0.1)
        })

    });

    if (!selection) {
        return null;
    }

    return (
        <React.Fragment>
            <div>
                <svg ref={svgRef} width="100%" viewBox={'0 0 ' + svgWidth + ' ' + svgHeight}>
                    <defs>
                        <linearGradient id="gradient" x1="100%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#A066B5" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#A066B5" stopOpacity="1" />
                        </linearGradient>

                    </defs>
                    <g transform={'translate(' + margin.left + ',' + margin.top + ')'}>
                        <clipPath id="ClipPath">
                            <rect x="0" y="0" width={width} height={height} />
                        </clipPath>
                        <g className="content" clipPath="url(#ClipPath)" />
                        <g className="non-clip-content" />
                        <g className="x-axis" />
                        <g className="y-axis" />
                    </g>
                </svg>
            </div>
        </React.Fragment>
    );
}

export default BrushedAreaChart;