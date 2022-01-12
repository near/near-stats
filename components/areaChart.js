import React from "react";
import * as d3 from "d3";
import { formatNumbers } from '../helpers/formatNumbers';

function AreaChart({ account_data = [], app_data = [], x = '_x', y = '_y', compare = 30, growth = false, detail }) {

    let dateExtent = d3.extent(account_data, d => new Date(d[x]));
    let startDate = d3.timeDay.offset(dateExtent[1], -compare)

    account_data.sort((a, b) => new Date(a[x]) > new Date(b[x]) ? 1 : -1)
    app_data.sort((a, b) => new Date(a[x]) > new Date(b[x]) ? 1 : -1)

    const svgRef = React.useRef();

    // declare margins
    const margin = {
        left: 100,
        right: 100,
        top: 20,
        bottom: 50
    }

    // base width & height. All other calculations based on this value
    const svgWidth = 700
    const svgHeight = 300

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right

    // will be called initially and on every data change
    React.useEffect(() => {

        account_data = account_data.filter(d => new Date(d[x]) > startDate)
        app_data = app_data.filter(d => new Date(d[x]) > startDate)

        // rollup up the app data to a single total
        let app_total_data = d3.rollups(app_data, v => d3.sum(v, d => d[y]), d => d[x])

        // combine the data for stacking, reducing the account total for each day by the amount of accounts in the top 10 apps.
        let combined_data = {}

        app_total_data.forEach(d => {
            let date = d[0].split('T')[0]
            combined_data[date] = { [x]: date, 'other': 0, 'top apps': detail ? 0 : d[1] }
        })

        account_data.forEach(d => {
            let date = d[x].split('T')[0]
            if (!combined_data.hasOwnProperty(date)) {
                combined_data[date] = { [x]: date, 'other': detail ? 0 : parseInt(d[y]), 'top apps': 0 }
            } else {
                combined_data[date]['other'] = detail ? 0 : parseInt(d[y]) - combined_data[date]['top apps']
            }
        })

        combined_data = Object.values(combined_data)

        let app_detail = app_data.map(d => ({ ...d, [y]: detail ? d[y] : d[y] }))

        // set d3 references
        const svg = d3.select(svgRef.current)
        const svgContent = svg.select(".content");

        var stackedData = d3.stack()
            .keys(['other', 'top apps'])
            (combined_data)

        if (growth == true) {
            let other_start = stackedData[0][0][1]
            let app_start = stackedData[1][0][1]

            for (let i = 0; i < stackedData[0].length; i++) {
                stackedData[0][i][1] = (stackedData[0][i][1] - other_start > 0) ? stackedData[0][i][1] - other_start : 0
                stackedData[1][i][0] = (stackedData[1][i][0] - other_start > 0 ) ? stackedData[1][i][0] - other_start : 0

                stackedData[1][i][1] = stackedData[1][i][1] - app_start
            }
        }


        let other_apps_line_data = stackedData[0].map(d => ({[x]: d.data[x], [y] : detail ? 0 : d[1]}) )
        let top_apps_line_data = stackedData[1].map(d => ({[x]: d.data[x], [y] : detail ? 0 : d[1]}) )

        var stacked_apps = d3.groups(app_detail, d => d.entity_id)

        // function compare( a, b ) {
        //     if ( a[1][a[1].length-1][y] < b[1][b[1].length-1][y] ){
        //       return 1;
        //     }
        //     if ( a[1][a[1].length-1][y] > b[1][b[1].length-1][y] ){
        //       return -1;
        //     }
        //     return 0;
        //   }
          
        // var stacked_apps = stacked_apps_all.sort(compare).slice(0,10)
        

        if (growth == true){
            stacked_apps.forEach(app => {
                let start = app[1][0][y]
                app[1].forEach(d => {
                    d[y] = d[y] - start
                })
            })
        }

        // time scale for X axis
        const xScale = d3.scaleTime()
            .range([0, width])
            .domain([startDate, d3.max(account_data, d => new Date(d[x]))])

        // Linear scale for Overview
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(stackedData[1], d => d[1])])

        // Linear scale for Top 10 view
        const appYscale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(stacked_apps.map(d => d[1]).flat(), d => d[y])])

        // generator for svg path
        const lineGenerator = d3.line()
            .x(d => xScale(new Date(d[x])))
            .y(d => yScale(d[y]))
            .curve(d3.curveMonotoneX)

        const appLineGenerator = d3.line()
            .x(d => xScale(new Date(d[x])))
            .y(d => appYscale(d[y]))
            .curve(d3.curveMonotoneX)

        // Generators svg area
        const areaGenerator = d3.area()
            .x(d => xScale(new Date(d.data[x])))
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))
            .curve(d3.curveMonotoneX)

            const t = d3.transition()
            .duration(500)

        // draw stacked area chart
        svgContent
            .selectAll(".current-area")
            .data(stackedData)
            .join("path")
            .attr("class", "current-area transition-all")
            .attr("stroke", "none")
            .attr("fill", (d, i) => i === 0 ? "url(#gradient-bottom)" : "url(#gradient-top)")
            .attr("d", areaGenerator)

        // add All Other Apps line
        svgContent
            .selectAll(".other-apps-data-line")
            .data([other_apps_line_data])
            .join("path")
            .attr("class", "other-apps-data-line transition-all")
            .attr("stroke", "#3EAAB7")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("stroke-opacity", detail ? 0 : 1)
            .attr("stroke-linecap", "round")
            .attr("d", lineGenerator);

        // add Top 10 apps line
        svgContent
            .selectAll(".top-apps-data-line")
            .data([top_apps_line_data])
            .join("path")
            .attr("class", "top-apps-data-line transition-all")
            .attr("stroke", "#9B83FD")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("stroke-opacity", detail ? 0 : 1)
            .attr("stroke-linecap", "round")
            .attr("d", lineGenerator);

        // Overview Tooltip
        // create all other apps tooltip
        var other_app_tooltip = svgContent.append("g")
            .attr("class", "area-tooltip")
            .style("display", "none");

        // draw indicator circle
        other_app_tooltip.append("circle")
            .attr("r", 5)
            .attr('fill','#3EAAB7');

        // draw tooltip box
        other_app_tooltip.append("rect")
            .attr('class',"tooltip-box")
            .attr("x", 9)
            .attr("y", -2)
            .attr("height",25)
            .attr('fill','white')
            .attr('rx','5px');

        // add tooltip text
        other_app_tooltip.append("text")
            .attr("x", 15)
            .attr("dy", "1.05em")
            .style("font-size",15);

        // create top 10 apps tooltip
        var top_app_tooltip = svgContent.append("g")
            .attr("class", "area-tooltip")
            .style("display", "none");

        // draw indicator circle
        top_app_tooltip.append("circle")
            .attr("r",5)
            .attr('fill','#9B83FD');

        // draw tooltip box
        top_app_tooltip.append("rect")
            .attr('class',"tooltip-box")
            .attr("x", 9)
            .attr("y", -23)
            .attr("height",25)
            .attr('rx','5px');

        // add tooltip text
        top_app_tooltip.append("text")
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
                other_app_tooltip.style("display", detail ? "none" : null)
                top_app_tooltip.style("display", detail ? "none" : null)
            })
            .on("mouseout", function() {
                other_app_tooltip.style("display", "none");
                top_app_tooltip.style("display", "none");
            })
            .on("mousemove", mousemove);
        
        // transform tooltip placement and text based on hover position
        function mousemove(event) {
            
            var hover_date = xScale.invert(d3.pointer(event)[0]),
                other_data_point = other_apps_line_data.find( ({ collected_for_day }) => collected_for_day === hover_date.toISOString().split('T')[0]),
                top_data_point = top_apps_line_data.find( ({ collected_for_day }) => collected_for_day === hover_date.toISOString().split('T')[0]);
            
            if (other_data_point){
            var y_value=parseFloat(other_data_point['total_accounts']);
            other_app_tooltip.attr("transform", "translate(" + xScale(new Date(other_data_point.collected_for_day)) + "," + yScale(y_value)+ ")"); 
            other_app_tooltip.select("text").text(formatNumbers(y_value));
            other_app_tooltip.select("rect").attr('width',other_app_tooltip.select("text").node().getComputedTextLength()+12)
            }

            if (top_data_point){
            var y_value=parseFloat(top_data_point['total_accounts']);
            top_app_tooltip.attr("transform", "translate(" + xScale(new Date(top_data_point.collected_for_day)) + "," + yScale(y_value)+ ")"); 
            top_app_tooltip.select("text").text(formatNumbers(y_value));
            top_app_tooltip.select("rect").attr('width',top_app_tooltip.select("text").node().getComputedTextLength()+12)
            }

        }

        // Top 10 View
        // create group for line and label
        var top_app_group = svgContent
            .selectAll('.app-label-group')
            .data(stacked_apps)
            .join('g')
            .attr("class", "app-label-group")
            .attr("id",d => 'groupid'+d[0]);
            

        // move group to front to enable visibility
        d3.selection.prototype.moveToFront = function() {
                return this.each(function(){
                  this.parentNode.appendChild(this);
                });
              };

        // control visibility of group
        svgContent
            .selectAll(".app-label-group")
            .attr("opacity", detail ? 1 : 0)
            .attr("stroke-opacity", detail ? .4 : 0)
            .on("mouseover", function (t) {
                d3.selectAll(".app-label-group").attr("stroke-opacity",.1)
                d3.selectAll(".app-label-text").attr("opacity",.4)
                d3.select(this).attr("stroke-opacity",1).select(".app-label-text").attr("opacity",1)
                d3.select(this).moveToFront()
            })
            .on("mouseout", function (t) {
                // d3.select(this).attr("stroke-opacity",.1)
                d3.selectAll(".app-label-group").attr("stroke-opacity",.4)
                d3.selectAll(".app-label-text").attr("opacity",1)
            });

        // draw line
        top_app_group
            .selectAll("path")
            .data(d => [d])
            .join("path")
            .attr("class", "app-data-line")
            .attr("stroke", "#985FD0")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("stroke-linecap", "round")
            .attr("d", d => {
                console.log(d)
                return appLineGenerator(d[1])
            })

        // draw label box
        top_app_group
            .selectAll("rect")
            .data(d => [d])
            .join("rect")
            .attr('x', d => xScale(new Date(d[1][d[1].length - 1][x])) + 5)
            .attr('y', d => appYscale(d[1][d[1].length - 1][y])-10)
            .attr('height', 20)
            .attr('rx', 10)
            .attr("class", "app-label-box")
            .attr("stroke", "#985FD0")
            .attr("stroke-width", 2)
            .attr('fill','currentcolor')
        
        // add label text
        top_app_group
            .selectAll("text")
            .data(d => [d])
            .join("text")
            .attr('x', d => xScale(new Date(d[1][d[1].length - 1][x])) + 10)
            .attr('y', d => appYscale(d[1][d[1].length - 1][y]))
            .text(d => d[0])
            .attr('dominant-baseline', 'middle')
            .attr('class', 'app-label-text')
            .attr('id',d => 'id'+d[0])
            .attr('font-size', '0.7em')
        
        // resize box to fit label
        top_app_group
            .selectAll('rect')
            .attr('width',d => top_app_group.select("#id"+d[0]).node().getComputedTextLength()+10);

        // axes
        // scale x axis
        const xAxis = d3.axisBottom(xScale).ticks(3);

        // draw x axis
        svg
            .select(".x-axis")
            .attr("transform", `translate(0, ${height})`)
            .attr('font-family', 'manrope')
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick line").remove())

        // scale y axis for overview and top 10
        const yAxis = d3.axisLeft(yScale).ticks(5);
        const appYaxis = d3.axisLeft(appYscale).ticks(3);

        // draw applicable y axis
        svg
            .select(".y-axis")
            .call(detail ? appYaxis : yAxis)
            .attr('font-family', 'manrope')
            .attr('font-size', '0.7em')
            .call(g => g.selectAll(".tick>line").remove())
            .call(g => g.select(".domain").remove());

        // draw grid lines
        svg
            .select(".y-axis")
            .append('g')
            .attr('class', 'y-grid')
            .call(detail ? appYaxis.tickSize(-width).tickFormat("") : yAxis.tickSize(-width).tickFormat(""))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick>line")
                .attr("stroke", "#757575")
                .attr('opacity', .2))

        // draw legend boxes
        const size = 10

        svg.selectAll('.top-app-box')
            .data([0])
            .join("rect")
            .attr('class','top-app-box')
            .attr("x",margin.left)
            .attr("y",height+55)
            .attr("width", size)
            .attr("height", size)
            .style("fill", detail ? "none" : "#9B83FD")

        svg.selectAll('.other-app-box')
            .data([0])
            .join("rect")
            .attr('class','other-app-box')
            .attr("x",margin.left+100)
            .attr("y",height+55)
            .attr("width", size)
            .attr("height", size)
            .style("fill", "#3EAAB7")
            .attr("opacity", detail ? 0 : 1)

        // add legend text
        svg.selectAll('.top-app-text')
            .data([0])
            .join("text")
            .attr('class','top-app-text')
            .attr("x",margin.left+15)
            .attr("y", height+61)
            .text("Top 10 Apps")
            .style("font-size", "0.7em")
            .attr("alignment-baseline","middle")
            .attr("opacity", detail ? 0 : 1)

        svg.selectAll('.other-app-text')
            .data([0])
            .join("text")
            .attr('class','other-app-text')
            .attr("x", margin.left+115)
            .attr("y", height+61)
            .text("All Other Apps")
            .style("font-size", "0.7em")
            .attr("alignment-baseline","middle")
            .attr("opacity", detail ? 0 : 1)

        
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
    }, [account_data, app_data, detail, height, width, x, y, compare]);

    return (
        <React.Fragment>
            <div>
                <svg ref={svgRef} width="100%" viewBox={'0 0 ' + svgWidth + ' ' + svgHeight}>
                    <defs>
                        <linearGradient id="gradient-top" x1="100%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8776EE" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#8684F8" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="gradient-bottom" x1="100%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8896DF" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#9FD0DB" stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <g transform={'translate(' + margin.left + ',' + margin.top + ')'}>
                        <g className="x-axis" />
                        <g className="y-axis" />
                        <g className="content" />
                        <g className="non-clip-content" />
                    </g>
                </svg>
            </div>
        </React.Fragment>
    );
}

export default AreaChart;