(this["webpackJsonpvuexy-react-admin-dashboard"]=this["webpackJsonpvuexy-react-admin-dashboard"]||[]).push([[63],{541:function(t,e,a){"use strict";a.r(e);var r=a(18),s=a(19),n=a(21),l=a(20),c=a(0),o=a.n(c),i=a(390),u=a.n(i),m=a(24),p=a(16),h=a(56),d=a.n(h),f=function(t){Object(n.a)(a,t);var e=Object(l.a)(a);function a(t){var s;return Object(r.a)(this,a),(s=e.call(this,t)).handleAlert=function(t,e){m.a.push("/mywallet/deposit")},s.state={alertState:!0,alertTitle:"",alertType:null,text:"",text2:""},s}return Object(s.a)(a,[{key:"componentDidMount",value:function(){var t=d.a.parse(this.props.location.search);if(t){var e=t.transactionStatus,a="",r="Transaction Id :".concat(t.orderId),s="Amount :".concat(t.amount);switch(t.transactionStatus){case"SUCCESS":a="success";break;case"PENDING":a="info";break;case"FAIL":default:a="error"}this.setState({alertState:!0,alertTitle:e,alertType:a,text:r,text2:s})}}},{key:"render",value:function(){var t=this;return o.a.createElement(o.a.Fragment,null,"success"===t.state.alertType?o.a.createElement(u.a,{success:!0,title:t.state.alertTitle,show:t.state.alertState,onConfirm:function(){return t.handleAlert("alertState",!1)}},o.a.createElement("p",{className:"sweet-alert-text"},t.state.text),o.a.createElement("p",{className:"sweet-alert-text"},t.state.text2)):"info"===t.state.alertType?o.a.createElement(u.a,{info:!0,title:t.state.alertTitle,show:t.state.alertState,onConfirm:function(){return t.handleAlert("alertState",!1)}},o.a.createElement("p",{className:"sweet-alert-text"},t.state.text),o.a.createElement("p",{className:"sweet-alert-text"},t.state.text2)):"error"===t.state.alertType?o.a.createElement(u.a,{error:!0,title:t.state.alertTitle,show:t.state.alertState,onConfirm:function(){return t.handleAlert("alertState",!1)}},o.a.createElement("p",{className:"sweet-alert-text"},t.state.text),o.a.createElement("p",{className:"sweet-alert-text"},t.state.text2)):void 0)}}]),a}(o.a.Component);e.default=Object(p.b)((function(t){return{PayResultsData:t.paymentGateWay.PayResultsData}}),{})(f)}}]);