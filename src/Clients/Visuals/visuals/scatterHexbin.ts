/*
 *  Power BI Visualizations
 *  
 *  Hexbin Scatterplot 
 *
 *  Copyright (c) David Eldersveld, BlueGranite Inc.
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 *
 *  Acknowledgements
 *  Calculations for bin assignment and hexagon placement found in assignHexbin()
 *      and buildHexagon() adapted from the d3.hexbin plugin: 
 *      https://github.com/d3/d3-plugins/tree/master/hexbin
 */

/* Please make sure that this path is correct */
/// <reference path="../_references.ts"/>

module powerbi.visuals {

    import SelectionManager = utility.SelectionManager;

    export interface ScatterHexbinData {
        category: string;
        xValue: number;
        yValue: number;
        sizeValue: number;
        selector: SelectionId;
        tooltipInfo: TooltipDataItem[];
    };

    export class ScatterHexbin implements IVisual {

        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: "Category",
                    kind: VisualDataRoleKind.Grouping
                },
                {
                    name: "X",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "X Axis"
                },
                {
                    name: "Y",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "Y Axis"
                },
                {
                    name: "Value",
                    kind: VisualDataRoleKind.Measure,
                    displayName: "Value"
                }
            ],
            dataViewMappings: [{
                categorical: {
                    categories: {
                        for: { in: "Category" }
                    },
                    values: {
                        select: [{ bind: { to: 'X' } },
                            { bind: { to: 'Y' } },
                            { bind: { to: 'Value' } }
                        ]
                    },
                }
            }],
            objects: {
                general: {
                    displayName: 'General',
                    properties: {
                        fill: {
                            type: { fill: { solid: { color: true } } },
                            displayName: 'Fill'
                        },
                        hexRadius: {
                            type: { numeric: true },
                            displayName: 'Bin radius'
                        }
                    },
                }
            },
        };

        //private element: JQuery;
        //private viewPort: IViewport;
        private svg: D3.Selection;
        private hexGroup: D3.Selection;
        private selectionManager: SelectionManager;
        private dataView: DataView;

        public static converter(dataView: DataView): ScatterHexbinData[] {
            //console.log('converter');
            //console.log(dataView);

            var catDv: DataViewCategorical = dataView.categorical;
            var cat = catDv.categories[0];
            var catValues = cat.values;
            var values = catDv.values;

            var formatStringProp = <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' };
            var categorySourceFormatString = valueFormatter.getFormatString(cat.source, formatStringProp);

            var dataArray: ScatterHexbinData[] = [];

            var colIndex = {
                //category: null,
                x: null,
                y: null,
                value: null
            };

            if (values[0].source.roles) {
                for (var j = 0, len = values.length; j < len; j++) {
                    //console.log(j);
                    //console.log(values[j].source.roles);
                    var cols = values[j].source.roles;
                    var colKey = Object.keys(cols);
                    console.log("Keys: " + colKey[0]);
                    //SWITCH not working but multiple IFs do
                    //if (colKey[0] === "Category") { colIndex.category = j; }
                    if (colKey[0] === "X") { colIndex.x = j; }
                    if (colKey[0] === "Y") { colIndex.y = j; }
                    if (colKey[0] === "Value") { colIndex.value = j; }
                    console.log(colIndex);
                }
            }
            else {
                colIndex = { "x": 0, "y": 1, "value": 2 };
            }

            for (var i = 0, len = catValues.length; i < len; i++) {
                var formattedCategoryValue = valueFormatter.format(catValues[i], categorySourceFormatString);

                var tooltipInfo: TooltipDataItem[] = TooltipBuilder.createTooltipInfo(
                    formatStringProp,
                    catDv.categories, formattedCategoryValue,
                    values,
                    values[0].values[i],
                    null,
                    0);

                if (values.length > 1) {
                    var toolTip = TooltipBuilder.createTooltipInfo(
                        formatStringProp,
                        catDv.categories, formattedCategoryValue,
                        values,
                        values[1].values[i],
                        null,
                        1)[1];
                    if (toolTip) {
                        tooltipInfo.push(toolTip);
                    }
                }

                dataArray.push({
                    category: catValues[i],
                    xValue: values[0].values[i],
                    yValue: values.length > 1 ? values[colIndex.y].values[i] : 1,
                    sizeValue: values.length > 2 ? values[colIndex.value].values[i] : 1,
                    selector: SelectionId.createWithId(cat.identity[i]),
                    tooltipInfo: tooltipInfo
                });
            }

            return dataArray;
        }

        public init(options: VisualInitOptions): void {

            var svg = this.svg = d3.select(options.element.get(0))
                .append('svg')
                .attr("class", "svgHexbinContainer")
                .attr("height", options.viewport.height)
                .attr("width", options.viewport.width);

            var mainChart = svg.append('g')
                .attr("class", "mainChartGroup");

            this.hexGroup = mainChart.append("g")
                .attr("class", "hexGroup");

            mainChart.append("g")
                .attr("class", "dotGroup");

            var xAxisTicks = mainChart.append("g")
                .attr("class", "axis")
                .attr("id", "xAxis");

            var yAxisTicks = mainChart.append("g")
                .attr("class", "axis")
                .attr("id", "yAxis");

            xAxisTicks.append("text")
                .attr("class", "label")
                .attr("id", "xAxisLabel");

            yAxisTicks.append("text")
                .attr("class", "label")
                .attr("id", "yAxisLabel");

            this.selectionManager = new SelectionManager({ hostServices: options.host });
        }

        public update(options: VisualUpdateOptions) {
            console.log('update');
            console.log(options);

            d3.select(".svgHexbinContainer")
                .attr("height", options.viewport.height)
                .attr("width", options.viewport.width);

            this.dataView = options.dataViews[0];
            var chartData = ScatterHexbin.converter(options.dataViews[0]);
            var fillColor = this.getFill(this.dataView).solid.color;
            var hexRadius = this.getHexRadius(this.dataView);
			
            var colMetaIndex = {
                category: null,
                x: null,
                y: null,
                value: null
            };

            if (this.dataView.metadata.columns[0].roles) {
                var meta = this.dataView.metadata.columns;
                for (var j in meta) {
                    var cols = meta[j].roles;
                    var colKey = Object.keys(cols);
                    //console.log("Keys: " + colKey[0]);
                    //SWITCH not working but multiple IFs do
                    if (colKey[0] === "Category") { colMetaIndex.category = j; }
                    if (colKey[0] === "X") { colMetaIndex.x = j; }
                    if (colKey[0] === "Y") { colMetaIndex.y = j; }
                    if (colKey[0] === "Value") { colMetaIndex.value = j; }
                }
            }
            else {
                colMetaIndex = { "category": 0, "x": 1, "y": 2, "value": 3 };
            }

            var margin = { top: 20, right: 0, bottom: 20, left: 50 };
            var w = $(".svgHexbinContainer").width() - margin.left;
            var h = $(".svgHexbinContainer").height() - margin.bottom;
            var hexGroup = d3.select(".hexGroup");
            var dotGroup = d3.select(".dotGroup");
            var xAxisTicks = d3.select("#xAxis");
            var yAxisTicks = d3.select("#yAxis");
            var xAxisLabel = d3.select("#xAxisLabel");
            var yAxisLabel = d3.select("#yAxisLabel");
            var xMeta = this.dataView.metadata.columns[colMetaIndex.x].displayName;
            var yMeta = this.dataView.metadata.columns[colMetaIndex.y].displayName;

            var selectionManager = this.selectionManager;

            var xScale = d3.scale.linear()
                .domain(d3.extent(chartData, function (d) {
                    var v = getXValue(d);
                    return v;
                })).nice()
                .range([0, w - margin.left]);

            var yScale = d3.scale.linear()
                .domain(d3.extent(chartData, function (d) {
                    var v = getYValue(d);
                    return v;
                })).nice()
                .range([h - margin.bottom, 0]);

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(5);

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");
            //.ticks(5);

            xAxisTicks
                .attr("transform", "translate(" + margin.left + "," + (h - margin.bottom) + ")")
                .call(xAxis);

            xAxisLabel
                .attr("transform", "translate(" + (w / 2) + "," + (margin.bottom + 6) + ")")
                .attr("dy", ".32em")
                .style("text-anchor", "end")
                .text(xMeta);

            yAxisTicks
                .attr("transform", "translate(" + margin.left + "," + 0 + ")")
                .call(yAxis);

            yAxisLabel
                .attr("transform-origin", "left")
                .attr("transform", "translate(" + (-margin.left + 6) + "," + (h / 2) + ") rotate(-90)")
                .attr("dy", ".32em")
                .style("text-anchor", "end")
                .text(yMeta);

            //TooltipManager.addTooltip(this.hexGroup, (tooltipEvent: TooltipEvent) => tooltipEvent.data.toolTipInfo);  

            makeHexbins();
            makeDots();

            function getXValue(d): number {
                return d.xValue;
            }

            function getYValue(d): number {
                return d.yValue;
            }

            function makeDots() {
                var dot = dotGroup.selectAll(".dot")
                    .data(chartData);

                dot.enter()
                    .append("circle")
                    .attr("class", "dot")
                    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
                    .attr("r", "3px")
                    .attr("cx", function (d) { var v = getXValue(d); return xScale(v); })
                    .attr("cy", function (d) { var v = getYValue(d); return yScale(v); })
                //.attr("cy", "0")
                    .style("fill", "grey");
                //.style("fill", function(d) { return color(d.category); })

                dot.transition()
                    .duration(2000)
                    .attr("cx", function (d) { var v = getXValue(d); return xScale(v); })
                    .attr("cy", function (d) { var v = getYValue(d); return yScale(v); });
            
                dot.on("click", function (d) {
                    console.log('dot clicked');
                    console.log(d);
                    selectionManager.select(d.selector).then(ids => {
                        if (ids.length > 0) {
                            dot.style('opacity', 1);
                            d3.select(this).style('opacity', 1);
                        }
                        else {
                            dot.style('opacity', 1);
                        }
                    });
                });

                dot.exit()
                    .transition()
                    .duration(2000)
                    .remove();
            }

            function makeHexbins() {

                function assignHexbin(points, hexRadius) {

                    var r = hexRadius;
                    var dx = r * 2 * Math.sin(Math.PI / 3);
                    var dy = r * 1.5;

                    var binsById = {};

                    points.forEach(function (point, i) {
                        var origX = xScale(getXValue(point));
                        var origY = yScale(getYValue(point));

                        var py = origY / dy;
                        var pj = Math.round(py);
                        var px = origX / dx - (pj & 1 ? .5 : 0);
                        var pi = Math.round(px);
                        var py1 = py - pj;

                        if (Math.abs(py1) * 3 > 1) {
                            var px1 = px - pi;
                            var pi2 = pi + (px < pi ? -1 : 1) / 2;
                            var pj2 = pj + (py < pj ? -1 : 1);
                            var px2 = px - pi2;
                            var py2 = py - pj2;
                            if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) {
                                pi = pi2 + (pj & 1 ? 1 : -1) / 2;
                                pj = pj2;
                            }
                        }

                        var id = pi + "-" + pj;
                        var bin = binsById[id];
                        if (bin) bin.push(point); else {
                            bin = binsById[id] = [point];
                            bin.i = pi;
                            bin.j = pj;
                            bin.x = (pi + (pj & 1 ? 1 / 2 : 0)) * dx;
                            bin.y = pj * dy;
                        }
                    });

                    return d3.values(binsById);
                }

                function buildHexagon(radius) {
                    var x0 = 0, y0 = 0;
                    var d3_hexbinAngles = d3.range(0, 2 * Math.PI, Math.PI / 3);
                    return "m" + d3_hexbinAngles.map(function (angle) {
                        var x1 = Math.sin(angle) * radius;
                        var y1 = -Math.cos(angle) * radius;
                        var dx = x1 - x0;
                        var dy = y1 - y0;
                        x0 = x1;
                        y0 = y1;
                        return [dx, dy];
                    });
                }

                function getSaturation(data) {
                    var aggSize = 0;
                    for (var j in data) {
                        if (typeof data[j] === "object") {
                            //console.log('j value');
                            //console.log(hexData[i][j].sizeValue);
                            if (data[j].sizeValue === 1) {
                                aggSize = aggSize + 1;
                            }
                            else {
                                aggSize = aggSize + data[j].sizeValue;
                            }
                        }
                    }
                    return aggSize;
                }

                var hexData = assignHexbin(chartData, hexRadius);
                //console.log('hexData: ' + JSON.stringify(hexData));
                var fill = fillColor;

                var hexColor = d3.scale.linear()
                    .domain(d3.extent(hexData, function (d) { var v = getSaturation(d); return v; })).nice()
                    .range(["rgb(233, 233, 233)", fill])
                    .interpolate(d3.interpolateLab);

                var hex = hexGroup.selectAll(".hexagon")
                    .data(hexData);

                hex.enter()
                    .append("path")
                    .attr("class", "hexagon")
                    .attr("d", buildHexagon(hexRadius))
                    .attr("transform", function (d) { return "translate(" + (d.x + margin.left) + "," + (d.y) + ")"; })
                    .style("fill", function (d) { return hexColor(getSaturation(d)); })
                //.style("fill-opacity", ".8")
                    .style("stroke", "#FFFFFF")
                    .style("stroke-width", "1px");

                hex.transition()
                    .duration(2000)
                    .attr("d", buildHexagon(hexRadius))
                    .attr("transform", function (d) {
                        return "translate(" + (d.x + margin.left) + "," + (d.y) + ")";
                    })
                    .style("fill", function (d) {
                        return hexColor(getSaturation(d));
                    });

                //hex.on("click", function (d) {
                //    selectionManager.select(d[0].identity).then(ids => {
                //        if (ids.length > 0) {
                //            hex.style('opacity', 1);
                //            d3.select(this).style('opacity', 1);
                //        }
                //        else {
                //            hex.style('opacity', 1);
                //        }
                //    });
                //});
                //hex.on('click', function (d) {
                //    console.log(d);
                //    selectionManager
                //        .select(d.selector);
                //    //.then(ids => d3.select(this).style('stroke-width', ids.length > 0 ? '2px' : '0px'));
                //}).data(chartData);
                //hex.on("click", function (d) { window.alert("clicked a hexagon: Count = " + d.length + " Details = " + JSON.stringify(d));});
                
                hex.exit()
                    .transition()
                    .duration(2000)
                    .remove();
            }

            //random jQuery CSS...
            $(".axis path").css({ "fill": "none", "stroke": "none", "shape-rendering": "crispEdges" });
            $(".axis line").css({ "fill": "none", "stroke": "grey", "shape-rendering": "crispEdges" });
            $(".axis text").css({ "fill": "black", "font-size": "11px", "font-family": "wf_segoe-ui_normal,helvetica,arial,sans-serif" });

        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            switch (options.objectName) {
                case 'general':
                    var general: VisualObjectInstance = {
                        objectName: 'general',
                        displayName: 'General',
                        selector: null,
                        properties: {
                            fill: this.getFill(this.dataView),
                            hexRadius: this.getHexRadius(this.dataView)
                        }
                    };
                    instances.push(general);
                    break;
            }

            return instances;
        }

        private getFill(dataView: DataView): Fill {
            if (dataView && dataView.metadata.objects) {
                var general = dataView.metadata.objects['general'];
                if (general) {
                    return <Fill>general['fill'];
                }
            }
            return { solid: { color: 'rgb(1, 184, 170)' } };
        }

        private getHexRadius(dataView: DataView): number {
            if (dataView && dataView.metadata.objects) {
                var general = dataView.metadata.objects['general'];
                if (general) {
                    return <number>general['hexRadius'];
                }
            }
            return 20;
        }

        public destroy() {
            d3.select(".svgHexbinContainer").remove();
        }

    }
}

module powerbi.visuals.plugins {
    export var _scatterHexbin: IVisualPlugin = {
        name: '_scatterHexbin',
        capabilities: ScatterHexbin.capabilities,
        create: () => new ScatterHexbin()
    };
}