var transitionMonthView = function() {
  ctx.tileDim = ctx.monthView ? ctx.initTileDim : ctx.detTileDim
  let monthView = d3.select("#monthView");
  // Legend
  ctx.legendVSpacing = ctx.tileDim;

  let monthViewWidth = monthView.node().getBoundingClientRect()["width"];

  ctx.xEndMonthView = monthViewWidth + 4.5*ctx.tileDim;
}

var switchView = function() {
    if (ctx.transitioning) {return;}
    ctx.transitioning = true;
    ctx.monthView = !ctx.monthView;
    let monthView = d3.select("#monthView");
    let detailedView = d3.select("#detailedView");
    let yogaButton = d3.select("#yogaButton");
    let yogaLabel = d3.select("#buttonLabel");
    let legendDuration = ctx.anim_duration;

    if (ctx.monthView) {
        // switch to month view
        // hide detailedView and button, hide legend, translate monthView to middle, show legend
        //temporary disable monthView for tooltips
        ctx.monthView = false;

        yogaButton.transition().duration(ctx.anim_duration)
            .style("opacity",0).on("end",()=>{yogaButton.style("visibility", "hidden");});
        yogaLabel.transition().duration(ctx.anim_duration)
            .style("opacity",0).on("end",()=>{yogaLabel.style("visibility", "hidden");});
        detailedView.transition().duration(ctx.anim_duration)
            .style("opacity",0).on("end",()=>{detailedView.style("visibility", "hidden");});
        monthView.select("#categoryLegend").transition().delay(ctx.anim_duration).duration(legendDuration)
            .style("opacity",0);
        monthView.transition().delay(ctx.anim_duration+legendDuration).duration(ctx.anim_duration)
            .attr("transform",`translate(${ctx.monthViewX},0) scale(1)`)
            .on("end",()=>{
              ctx.monthView = true;
              transitionMonthView();
              d3.select("#details").style("visibility", "hidden");
              d3.select("#insights").style("visibility", "hidden");
            });
        monthView.select("#categoryLegend").transition().delay(2*ctx.anim_duration+legendDuration).duration(legendDuration)
            .style("opacity",1)
            .on("end",()=>{ctx.transitioning = false;});
    }
    else {
        // switch to detailed view
        // hide legend, translate monthView to 0, show legend, show detailedView and button
        monthView.select("#categoryLegend").transition().duration(legendDuration)
            .style("opacity",0);
        monthView.transition().delay(legendDuration).duration(ctx.anim_duration)
            .attr("transform",`scale(0.8) translate(0,0)`)
            .on("end",()=>{
              transitionMonthView();
              if (!ctx.detViewCreated) {
                createDetailedView(ctx.screenData, d3.select("#mainSVG")); // function in detailed-view.js
                ctx.detViewCreated = true;

              }
              monthView.select("#categoryLegend").transition().duration(legendDuration)
                  .style("opacity",1);
              d3.select("#detailedView").transition().delay(legendDuration).duration(ctx.anim_duration)
                  .style("opacity",1).style("visibility", "visible")
                  .on("end",()=>{
                    ctx.transitioning = false;
                  });
              if (ctx.detailedView) { // don't show if insights
                d3.select("#yogaButton").transition().delay(legendDuration).duration(ctx.anim_duration)
                    .style("opacity",1).style("visibility", "visible");
                d3.select("#buttonLabel").transition().delay(legendDuration).duration(ctx.anim_duration)
                    .style("opacity",1).style("visibility", "visible");
                d3.select("#details").style("visibility", "visible");
              }
              else {
                d3.select("#insights").style("visibility", "visible");
              }

            });
    }
}

var updateHistogram = function(data) {
  let numColumns = ctx.columns.length;
  let histogram = d3.select("#histogram");
  let axisH = 0.05*ctx.histoH;
  let barStartY = ctx.histoH-axisH;
  let barMaxHeight = barStartY;
  let barVOffset = ctx.vmargin*4;

  histogram.selectAll("g.histoGroup").selectAll("rect")
      .transition()
      .duration(ctx.anim_duration)
      .attrs((entry,j) => {
        let weekDayIdx = entry.weekDayIdx; let column = entry.column;
        let newEntry = data.avgCategories[column][weekDayIdx];
        return {
          height: barMaxHeight-ctx.barScale(newEntry)+ctx.histoSmallestHeight,
          y: ctx.barScale(newEntry)
      }})
      .select("title").text((entry,j)=>`${data.avgCategories[entry.column][entry.weekDayIdx].toFixed(1).replace(/\.0$/, '')} min`);
}

var updateBarChart = function(data) {
    let barChart = d3.select("#barChartBars");

    barChart.selectAll("rect")
        .transition()
        .duration(ctx.anim_duration)
        .attr("width", (entry,i) => adjustWidth(data.avgCategoriesTotal[entry.column]))
        .select("title").text((entry,j)=>`${data.avgCategoriesTotal[entry.column].toFixed(1).replace(/\.0$/, '')} min`);;
}

var toggleYoga = function(){
    ctx.yogaMode = !ctx.yogaMode;
    let yogaLabel = d3.select("#labelONOFF");
    if (ctx.yogaMode){
      updateHistogram(ctx.screenData.after);
      updateBarChart(ctx.screenData.after);
      yogaLabel.text("ON");
    }
    else {
      updateHistogram(ctx.screenData.before);
      updateBarChart(ctx.screenData.before);
      yogaLabel.text("OFF");
    }

};
