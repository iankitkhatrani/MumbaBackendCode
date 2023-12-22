(function(a,b,c,d,e,f,g,h,i){a[e]||(i=a[e]=function(){(a[e].q=a[e].q||[]).push(arguments)},i.l=1*new Date,i.o=f,
g=b.createElement(c),h=b.getElementsByTagName(c)[0],g.async=1,g.src=d,g.setAttribute("n",e),h.parentNode.insertBefore(g,h)
)})(window,document,"script", "https://widgets.sir.sportradar.com/6d060ec58533208261fdc1cf775f07f6/widgetloader", "SIR", {
    theme: false, // using custom theme
    language: "en"
});
var matchId = document.getElementById("matchId").className;
SIR("addWidget", ".sr-widget-1", "match.lmtPlus", {showOdds:true,layout: "topdown", matchId:matchId});