(this["webpackJsonpvuexy-react-admin-dashboard"]=this["webpackJsonpvuexy-react-admin-dashboard"]||[]).push([[53],{418:function(e,a,t){"use strict";t.d(a,"a",(function(){return u})),t.d(a,"b",(function(){return l})),t.d(a,"c",(function(){return i}));var r=t(6),n=t.n(r),s=t(12),c=t(7),o=t(13),u=function(){var e=Object(s.a)(n.a.mark((function e(a){var t;return n.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,Object(c.a)("users/againusersave",{user:a});case 2:return t=e.sent,e.abrupt("return",t);case 4:case"end":return e.stop()}}),e)})));return function(a){return e.apply(this,arguments)}}(),l=function(e){return function(){var a=Object(s.a)(n.a.mark((function a(t){var r;return n.a.wrap((function(a){for(;;)switch(a.prev=a.next){case 0:return a.next=2,Object(c.a)("users/adminchangepassword",{user:e},t);case 2:(r=a.sent).status?o.b.success("successfully changed"):o.b.error(r.error);case 4:case"end":return a.stop()}}),a)})));return function(e){return a.apply(this,arguments)}}()},i=function(){var e=Object(s.a)(n.a.mark((function e(a){var t;return n.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,Object(c.a)("profile/profilesave",a);case 2:return t=e.sent,e.abrupt("return",t);case 4:case"end":return e.stop()}}),e)})));return function(a){return e.apply(this,arguments)}}()},548:function(e,a,t){"use strict";t.r(a);var r=t(18),n=t(19),s=t(21),c=t(20),o=t(0),u=t.n(o),l=t(139),i=t(200),p=t(140),d=t(137),m=t(34),f=t(196),w=t(52),h=t(59),v=t(74),b=t(195),E=t(353),g=t(418),y=t(16),j=function(e){Object(s.a)(t,e);var a=Object(c.a)(t);function t(){var e;Object(r.a)(this,t);for(var n=arguments.length,s=new Array(n),c=0;c<n;c++)s[c]=arguments[c];return(e=a.call.apply(a,[this].concat(s))).state={currentpassword:"",password:"",confirmpassword:""},e.changepassword=function(){e.state.password===e.state.confirmpassword?(e.props.changepassword({password:e.state.password,currentpassword:e.state.currentpassword}),e.setState({currentpassword:"",password:"",confirmpassword:""})):alert("Please input correct password and confirmpassword")},e}return Object(n.a)(t,[{key:"render",value:function(){var e=this;return u.a.createElement(l.a,null,u.a.createElement(i.a,{className:"text-center pt-2"},"Change Password"),u.a.createElement(p.a,null,u.a.createElement(d.a,null,u.a.createElement(m.a,{sm:"12",md:"12"},u.a.createElement(f.a,null,"CurrentPassword"),u.a.createElement(w.a,{className:"has-icon-left form-label-group position-relative"},u.a.createElement(h.a,{type:"password",placeholder:"CurrentPassword",required:!0,value:this.state.currentpassword,onChange:function(a){return e.setState({currentpassword:a.target.value})}}),u.a.createElement("div",{className:"form-control-position"},u.a.createElement(b.a,{size:15})))),u.a.createElement(m.a,{sm:"12",md:"12"},u.a.createElement(f.a,null,"New Password"),u.a.createElement(w.a,{className:"has-icon-left form-label-group position-relative"},u.a.createElement(h.a,{type:"password",placeholder:"Password",required:!0,value:this.state.password,onChange:function(a){return e.setState({password:a.target.value})}}),u.a.createElement("div",{className:"form-control-position"},u.a.createElement(E.a,{size:15})))),u.a.createElement(m.a,{sm:"12",md:"12"},u.a.createElement(f.a,null,"confirmpassword"),u.a.createElement(w.a,{className:"has-icon-left form-label-group position-relative"},u.a.createElement(h.a,{type:"password",placeholder:"confirmpassword",required:!0,value:this.state.confirmpassword,onChange:function(a){return e.setState({confirmpassword:a.target.value})}}),u.a.createElement("div",{className:"form-control-position"},u.a.createElement(E.a,{size:15})))),u.a.createElement(m.a,{sm:"12",md:"12",className:"d-flex justify-content-end"},u.a.createElement(v.a,{className:"igamez-button",color:"primary",type:"button",onClick:function(){return e.changepassword()}},"Save")))))}}]),t}(u.a.Component);a.default=Object(y.b)((function(e){return{}}),{changepassword:g.b})(j)}}]);