var adjustWidth = function(entry) {
    let ret = ctx.barChartScale(entry)+ctx.histoSmallestHeight;
    ret = ret < 20 ? 5 + ret*(3.0/5) : ret;
    return ret;
};

var selectFeature = function(event,d) { // add the selection feature
    if (ctx.selectedCols.includes(d.column)) {
      ctx.selectedCols.splice(ctx.selectedCols.indexOf(d.column),1);
    }
    else {
      ctx.selectedCols.push(d.column);
    }
    updateSelectedCols();
}

var updateSelectedCols = function() {
    let histogram = d3.select("#histogram");
    histogram.selectAll("g.histoGroup").selectAll("rect")
      .attr("fill", (entry,i) => {
          let color = ctx.selectedCols.length == 0 ? ctx.colors[i] : ctx.nonSelectedColor;
          if (ctx.selectedCols.includes(entry.column))
            color = ctx.colors[i];
          return color;
      })
    let barChart = d3.select("#barChartBars").selectAll("rect")
      .attr("fill", (entry,i) => {
          let color = ctx.selectedCols.length == 0 ? ctx.colors[i] : ctx.nonSelectedColor;
          if (ctx.selectedCols.includes(entry.column))
            color = ctx.colors[i];
          return color;
      });
    let difHistogram = d3.select("#difHistoBars").selectAll("rect")
      .attr("fill", (entry,i) => {
          let color = ctx.selectedCols.length == 0 ? ctx.colors[i] : ctx.nonSelectedColor;
          if (ctx.selectedCols.includes(entry.column))
            color = ctx.colors[i];
          return color;
      })
}

var createDetailedView = function(data,svgEl) {
    let numColumns = ctx.columns.length;
    let interGMargin = 0.5*ctx.histoAxisMargin;
    let barWidth = ((ctx.histoW-ctx.histoAxisMargin)/(7.0) - interGMargin) / numColumns - ctx.hmargin;
    let detailedView = svgEl.append("g").attr("id","detailedView")
      .attr("transform",`translate(${ctx.xEndMonthView},${0})`);

    // Detailed View title
    let titleFont = 2*ctx.fontSize;
    detailedView.append("text").attr("id","detailedViewTitle")
                .attr("x",0).attr("y",0.5*titleFont).attr("dominant-baseline","middle")
                .text("Detailed View").style("font-weight","bold").style("font-size",titleFont)
                .on("click",switchDetailedView)
                .on("mouseover",function(event,d){if (!ctx.detailedView){d3.select(this).style("fill",ctx.hoveredColor);}})
                .on("mouseout",function(event,d){if (!ctx.detailedView){d3.select(this).style("fill",ctx.hiddenTitleColor);}});

    detailedView.append("text").attr("id","insightsTitle")
                .attr("x",2*ctx.tileDim).attr("y",0.5*titleFont).attr("dominant-baseline","middle").text("Insights")
                .style("font-size",titleFont).style("font-weight","bold").style("fill",ctx.hiddenTitleColor)
                .on("click",switchDetailedView)
                .on("mouseover",function(event,d){if (ctx.detailedView){d3.select(this).style("fill",ctx.hoveredColor);}})
                .on("mouseout",function(event,d){if (ctx.detailedView){d3.select(this).style("fill",ctx.hiddenTitleColor);}});

    let yHistoStart = 2*titleFont;

    let details = detailedView.append("g").attr("id","details");
    let histogram = details.append("g").attr("id","histogram").attr("transform",`translate(0,${yHistoStart})`);
    let axisH = 0.05*ctx.histoH;
    let barStartY = ctx.histoH-axisH;
    let barMaxHeight = barStartY;
    let labelStartY = barStartY + ctx.vmargin;

    let axisExtent = []; Object.assign(axisExtent,ctx.ExtentOverAllCat["overall"]); axisExtent[1] += 10; //add a margin for the axis to cover

    ctx.barScale = d3.scaleLinear().domain(axisExtent)
                                   .range([barMaxHeight,0]);

    ctx.weekDays.forEach(function(weekDay,i){
      let dayG = histogram.append("g")
        .classed("histoGroup",true)
        .attr("transform",`translate(${ctx.histoAxisMargin+i*(interGMargin + numColumns*(barWidth+ctx.hmargin))},${0})`);

      let catListForDay = [];
      for (column of ctx.columns) {
        catListForDay.push({
          weekDay: weekDay, weekDayIdx: i,
          column: column,
          value: data.before.avgCategories[column][i]
        });
      }
      dayG.selectAll("rect").data(catListForDay).enter().append("rect")
        .attrs((entry,j) => { return {
          width: barWidth,
          height: barMaxHeight-ctx.barScale(entry.value)+ctx.histoSmallestHeight,
          x: j*(barWidth + ctx.hmargin), y: ctx.barScale(entry.value)
        }})
        .attr("fill", (entry,j) => ctx.colors[j])
        .on("click", selectFeature)
        //tooltip
        .append("svg:title").text((entry,j)=>`${entry.value.toFixed(1).replace(/\.0$/, '')} min`);

      // Week Days labels
      // add "s" to show that it's an average
      dayG.append("text").attr("transform",`translate(${3.5*(barWidth + ctx.hmargin)},${labelStartY+ctx.fontSize})`)
        .attr("text-anchor", "middle").attr("dominant-baseline","middle")
        .text(weekDay+"s");
    })

    // Vertical axis
    histogram.append("g").attr("id","histogramAxis")
      .call(d3.axisLeft(ctx.barScale));
    histogram.select("#histogramAxis").append("text").classed("axisLabel",true)
      .attr("y",0.5*barStartY).attr("transform", `rotate(-90,0,${0.5*barStartY}) translate(0,${-1.7*ctx.histoAxisMargin})`)
      .text("Screen Time (min)");

    let detailedViewTitleX = -histogram.select("#histogramAxis").node().getBBox()["width"];
    detailedView.select("#detailedViewTitle").attr("x",detailedViewTitleX);
    let insightsTitleX = detailedViewTitleX + detailedView.select("#detailedViewTitle").node().getBBox()["width"] + ctx.tileDim;
    detailedView.select("#insightsTitle").attr("x",insightsTitleX);

    let xEndHistogram = histogram.node().getBBox()["width"] + 5*ctx.hmargin;


    // Bar Chart for Categories
    ctx.barChartW = 0.98*ctx.histoW;
    ctx.barChartH = ctx.histoH;

    let histoDims = histogram.node().getBBox();

    let barChartY = yHistoStart + histoDims.height + 2*ctx.tileDim;
    let barChart = details.append("g").attr("id","barChart")
                               .attr("transform",`translate(${0},${barChartY})`);
    let barChartYAxisMargin = 0*ctx.hmargin; // 0 to stick it with the Y-axis
    let barChartXAxisMargin = ctx.histoAxisMargin;
    let barChartInterBarMargin = 2*ctx.vmargin;
    let barChartBarHeight = (ctx.barChartH - barChartXAxisMargin)/numColumns - barChartInterBarMargin;
    let barChartBarMaxWidth = ctx.barChartW - barChartYAxisMargin;
    let barChartAxisExtent = []; Object.assign(barChartAxisExtent,ctx.ExtentOverAllCatOverWeeks); barChartAxisExtent[1] += 10; // add a margin in axis
    ctx.barChartScale = d3.scaleLinear().domain(barChartAxisExtent)
                                        .range([0,barChartBarMaxWidth]);

    let catListOverWeeks = [];
    for (column of ctx.columns) {
      catListOverWeeks.push({
        column: column,
        value: data.before.avgCategoriesTotal[column]
      });
    }

    let bars = barChart.append("g").attr("id","barChartBars");

    bars.selectAll("rect").data(catListOverWeeks).enter().append("rect")
      .attrs((entry,i) => {return {
        width: adjustWidth(entry.value),
        height: barChartBarHeight,
        x: barChartYAxisMargin, y: 0.5*barChartInterBarMargin + i*(barChartBarHeight + barChartInterBarMargin)
      }})
      .attr("fill", (entry,j) => ctx.colors[j])
      .on("click", selectFeature)
      //tooltip
      .append("svg:title").text((entry,j)=>`${entry.value.toFixed(1).replace(/\.0$/, '')} min`);

    // Categories Vertical Axis
    let barChartStep = barChartInterBarMargin+barChartBarHeight;
    let barChartInPad = 1.0*barChartInterBarMargin/barChartStep;
    let barChartOuPad = 0.5*barChartInterBarMargin/barChartStep;
    let barChartCatScale = d3.scaleBand()
                              .domain(ctx.columnNames)
                              .range([0,ctx.barChartH - barChartXAxisMargin])
                              // paddings are the portion of the step (barHeight+interMargin)
                              .align(0.5)
                              .paddingInner(barChartInPad)
                              .paddingOuter(barChartOuPad);

    let barChartYAxis = d3.axisLeft(barChartCatScale).tickSizeOuter(0);
    barChart.append("g").attr("id","barCharYAxis")
            .call(barChartYAxis);

    // Screen Times Horizontal axis
    barChart.append("g").attr("id","barChartXAxis").attr("transform",`translate(0,${ctx.barChartH - barChartXAxisMargin})`)
            .call(d3.axisBottom(ctx.barChartScale));
    barChart.select("#barChartXAxis").append("text").classed("axisLabel",true)
      .attr("y",2*barChartXAxisMargin).attr("x",0.5*ctx.barChartW)
      .text("Average Daily Screen Time (min)");

    let barChartDims = barChart.node().getBBox();

    // Insights
    let monthViewDims = d3.select("#monthView").node().getBoundingClientRect();
    let insightsY = 0;
    let insights = detailedView.append("g").attr("id","insights");
    let insightsFont = 2*ctx.fontSize;

    // differential Histogram
    ctx.difHistoW = ctx.barChartW;
    ctx.difHistoH = ctx.histoH;
    let difInterGMargin = 0.5*ctx.histoAxisMargin;
    let difHistoAxisMargin = 0.5*ctx.histoAxisMargin;
    let difHistoY = 2*insightsFont;
    let difBarWidth = (ctx.difHistoW-difHistoAxisMargin)/numColumns - difInterGMargin;

    let difHistogram = insights.append("g").attr("id","difHistogram")
                                   .attr("transform",`translate(${0},${difHistoY})`);

    let difMidY = 0.5*ctx.difHistoH;
    let difDataList = [];
    for (column of ctx.columns) {
      difDataList.push({
        column: column,
        value: data.dif[column]
      });
    }

    let maxDifValue = d3.max([Math.abs(ctx.ExtentDifferential[0]),Math.abs(ctx.ExtentDifferential[1])]);
    let difDomainMargin = 10;
    let difExtent = [0,maxDifValue]; difExtent[1] += difDomainMargin;
    ctx.difBarScale = d3.scaleLinear().domain(difExtent)
                                    .range([0,difMidY]);

    let difBars = difHistogram.append("g").attr("id","difHistoBars")
                                          .attr("transform",`translate(${difHistoAxisMargin},${difMidY})`);
    difBars.selectAll("rect").data(difDataList).enter().append("rect")
      .attrs((entry,i) => {
        let absValue = Math.abs(entry.value);
        let y = entry.value <= 0 ? 0 : -ctx.difBarScale(absValue);
        return {
          width: difBarWidth, height: ctx.difBarScale(absValue),
          x : i*(difBarWidth + difInterGMargin), y : y
      }})
      .attr("fill", (entry,i) => ctx.colors[i])
      .on("click", selectFeature)
      //tooltip
      .append("svg:title").text((entry,j)=>`${entry.value.toFixed(1).replace(/\.0$/, '')}%`);

    // line for separating positive from negative
    difHistogram.append("line").attr("transform",`translate(0,0.5)`).attrs({
      x1: 0, y1: difMidY, x2: numColumns*(difBarWidth + difInterGMargin)+difHistoAxisMargin, y2: difMidY
    }).style("stroke","black");

    // differential histogram axis
    let numTicks = 5;

    let difBarScalePos = d3.scaleLinear().domain([0,maxDifValue+difDomainMargin]).range([difMidY,0]);
    difHistogram.append("g").attr("id","difHistoAxisPos")
                .call(d3.axisLeft(difBarScalePos).ticks(numTicks));
    let difBarScaleNeg = d3.scaleLinear().domain([-maxDifValue-difDomainMargin,0]).range([difMidY,0]);
    difHistogram.append("g").attr("id","difHistoAxisNeg").attr("transform",`translate(0,${difMidY})`)
                .call(d3.axisLeft(difBarScaleNeg).ticks(numTicks));
    difHistogram.append("text").classed("axisLabel",true)
      .attr("y",difMidY).attr("transform", `rotate(-90,0,${difMidY}) translate(0,${-1.5*ctx.histoAxisMargin})`)
      .text("Change in Screen Time (%)");

    // Insights texts
    let difHistoDims = difHistogram.node().getBBox();
    let insightTextsY = difHistoY + difHistoDims["height"] + 2*insightsFont;

    // biggest decrease in change
    let biggestDecreaseValue = d3.min(Object.values(data.dif));
    let biggestDecreaseCatIdx = Object.values(data.dif).indexOf(biggestDecreaseValue);
    let insight1 = insights.append("text").attr("x",0).attr("y",insightTextsY)
      .style("font-size",insightsFont);
    insight1.append("tspan").text("The biggest decrease in screen time was in ");
    insight1.append("tspan").text(ctx.columnNames[biggestDecreaseCatIdx])
                            .style("font-weight","bold").style("fill",ctx.colors[biggestDecreaseCatIdx]);
    insight1.append("tspan").text(" apps, with a decrease of ");
    insight1.append("tspan").text(`${Math.abs(biggestDecreaseValue.toFixed(1))}%.`)
                            .style("font-weight","bold").style("fill",ctx.colors[biggestDecreaseCatIdx]);
    insight1.call(wrap,ctx.barChartW); // custom wrap function from wrap-text.js

    let aggY = insight1.node().getBBox()["y"] + insight1.node().getBBox()["height"] + 1.5*insightsFont;

    // health and fitness changes
    let healthIdx = ctx.columns.indexOf("health_and_fitness");
    let healthValue = data.dif["health_and_fitness"];
    let insight2 = insights.append("text").attr("x",0).attr("y",aggY)
      .style("font-size",insightsFont);
    insight2.append("tspan").text("Thanks to Yoga, use of ");
    insight2.append("tspan").text(ctx.columnNames[healthIdx])
                            .style("font-weight","bold").style("fill",ctx.colors[healthIdx]);
    insight2.append("tspan").text(" apps changed by ");
    insight2.append("tspan").text(`+${healthValue.toFixed(1)}%`)
                            .style("font-weight","bold").style("fill",ctx.colors[healthIdx]);
    insight2.append("tspan").text(".");
    insight2.call(wrap,ctx.barChartW);

    aggY += insight2.node().getBBox()["height"] + 0.5*insightsFont;

    // maximal screen time drop
    let maximal_before = d3.max(data.before.rawCategories[ctx.columns[0]]);
    let maximal_after = d3.max(data.after.rawCategories[ctx.columns[0]]);
    let insight3 = insights.append("text").attr("x",0).attr("y",aggY)
      .style("font-size",insightsFont);
    insight3.append("tspan").text("The maximal ");
    insight3.append("tspan").text(ctx.columnNames[0])
                            .style("font-weight","bold").style("fill",ctx.colors[0]);
    insight3.append("tspan").text(" dropped from ");
    insight3.append("tspan").text(`${maximal_before} min`)
                            .style("font-weight","bold").style("fill",ctx.colors[0]);
    insight3.append("tspan").text(` to `);
    insight3.append("tspan").text(`${maximal_after} min`)
                            .style("font-weight","bold").style("fill",ctx.colors[0]);
    insight3.append("tspan").text(`; mindfulness and calm saved at least `);
    insight3.append("tspan").text(`${maximal_before-maximal_after} min`)
                            .style("font-weight","bold").style("fill",ctx.colors[0]);
    insight3.append("tspan").text(` daily of the user's time.`);
    insight3.call(wrap,ctx.barChartW);

    aggY += insight3.node().getBBox()["height"] + 0.5*insightsFont;

    // less time on non-essential apps
    let entertain_idx = ctx.columns.indexOf("entertainment");
    let social_idx = ctx.columns.indexOf("social_networking");
    let entertain_value = data.dif[ctx.columns[entertain_idx]].toFixed(1);
    let social_value = data.dif[ctx.columns[social_idx]].toFixed(1);
    let insight4 = insights.append("text").attr("x",0).attr("y",aggY)
      .style("font-size",insightsFont);
    insight4.append("tspan").text("Usage of non-essential apps has decreased well: for ");
    insight4.append("tspan").text(ctx.columnNames[entertain_idx])
                            .style("font-weight","bold").style("fill",ctx.colors[entertain_idx]);
    insight4.append("tspan").text(" apps screen time changed by ");
    insight4.append("tspan").text(`${entertain_value}%`)
                            .style("font-weight","bold").style("fill",ctx.colors[entertain_idx]);
    insight4.append("tspan").text(`, and `);
    insight4.append("tspan").text(ctx.columnNames[social_idx])
                            .style("font-weight","bold").style("fill",ctx.colors[social_idx]);
    insight4.append("tspan").text(` apps usage dropped by `);
    insight4.append("tspan").text(`${Math.abs(social_value)}%`)
                            .style("font-weight","bold").style("fill",ctx.colors[social_idx]);
    insight4.append("tspan").text(".");
    insight4.call(wrap,ctx.barChartW);

    // initially, set opacity to 0
    let buttonLabel = svgEl.append("g").attr("id","buttonLabel").attr("transform",`translate(${ctx.buttonX-5},${ctx.h-ctx.buttonY-20})`).style("font-size", "14px");
    buttonLabel.append("text").text("Yoga : "); buttonLabel.append("text").attr("id","labelONOFF").attr("x",42).text("OFF").style("font-weight","bold");
    buttonLabel.style("opacity",0).style("visibility", "hidden");
    insights.style("opacity",0).style("visibility", "hidden");
    detailedView.style("opacity",0).style("visibility", "hidden");
}

var switchDetailedView = function() {
    ctx.detailedView = !ctx.detailedView;
    let details = d3.select("#details");
    let insights = d3.select("#insights");
    let detailsTitle = d3.select("#detailedViewTitle");
    let insightsTitle = d3.select("#insightsTitle");
    let short_duration = 0.5*ctx.anim_duration;
    let yogaButton = d3.select("#yogaButton");
    let yogaLabel = d3.select("#buttonLabel");

    if (ctx.detailedView) {
        detailsTitle.style("fill","black");
        insightsTitle.style("fill",ctx.hiddenTitleColor);
        insights.transition().duration(short_duration)
                .style("opacity",0).on("end",()=>{insights.style("visibility","hidden")});
        details.transition().delay(short_duration).duration(short_duration)
                .style("opacity",1).style("visibility","visible");
        yogaButton.transition().delay(short_duration).duration(short_duration)
                .style("opacity",1).style("visibility","visible");
        yogaLabel.transition().delay(short_duration).duration(short_duration)
                .style("opacity",1).style("visibility","visible");

    }
    else {
        insightsTitle.style("fill","black");
        detailsTitle.style("fill",ctx.hiddenTitleColor);
        details.transition().duration(short_duration)
                .style("opacity",0).on("end",()=>{details.style("visibility","hidden")});
        yogaButton.transition().duration(short_duration)
                .style("opacity",0).on("end",()=>{details.style("visibility","hidden")});
        yogaLabel.transition().duration(short_duration)
                .style("opacity",0).on("end",()=>{details.style("visibility","hidden")});
        insights.transition().delay(short_duration).duration(short_duration)
                .style("opacity",1).style("visibility","visible");
    }
}
