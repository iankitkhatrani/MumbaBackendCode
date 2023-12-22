
var payload, logdata, icon_url, image_url, badge_url, notificationClicked, log_data, notificationAutoHide = !1;
const baseUrl = "https://app.webpush.ai/api/webpush/"
const app_image_url = "https://app.webpush.ai/"
// const baseUrl = "http://localhost:4001/api/webpush/"
// const app_image_url = "http://localhost:4001/"

async function request(Url, params, method){
  let t = await fetch( 
      baseUrl + Url, 
      { 
          body: JSON.stringify(params), 
          method: method, 
          headers: {
              'content-type': 'application/json'
          } 
      }
  )
  let resdata = await t.json()
  return resdata   
}

self.addEventListener("install", e => {
    self.skipWaiting()
}), self.addEventListener("activate", e => {
    console.log("Webpushr Service Worker is Activated!")
}), self.addEventListener("push", function(e) {
    payload = e.data.json()
    console.log(payload)

    log_data = {
      siteid: payload.siteid,
      userid: payload.userid
    }, 
    icon_url = void 0 !== payload.icon ? app_image_url + payload.icon : "", 
    image_url = void 0 !== payload.image ? app_image_url + payload.image : "", 
    badge_url = void 0 !== payload.b ? app_image_url + payload.b : "";

    let actions = []
    for (let i in payload.actions) {
      actions.push({title : payload.actions[i].title, action : payload.actions[i].actionurl})
    }
    const t = payload.texttitle,

    // i = {
    //     body: "body",
    //     icon: "https://cdn.webpushr.com/siteassets/thumbnails/gwgmuMgbsV.jpg",
    //     image: "https://cms.kasino9.com/uploads/8064e566e456c5a314ab1b4d1696267d.png",
    //     badge: "https://recording.ezugicdn.com/Dealer-Images/Single/41101.jpg",
    //     data: {
    //         url: payload.u,
    //         logs: log_data
    //     },
    //     requireInteraction: void 0 === payload.ah,
    //     actions: payload.a
    // };
    i = {
      body: payload.textbody,
      icon: icon_url,
      image: image_url,
      badge: badge_url,
      data: {
          url: payload.destination,
          logs: log_data
      },
      requireInteraction: void 0 === payload.ah,
      actions: actions
  };
  console.log(i)
    e.waitUntil(self.registration.showNotification(t, i).then(() => self.registration.getNotifications()).then(e => {}).then(async function() {
      let e = {
          type: "d",
          ...log_data
      };
      console.log(e)
      let rd = await request("lg", e, "POST")
      if (rd.status) {
        return e.text()
      }
    }))
}), self.addEventListener("notificationclick", async function(e) {
  console.log("notificationclick")
  console.log(e)
    notificationClicked = !0 
    e.notification.close() 
    e.action ? clients.openWindow(e.action) : e.waitUntil(clients.openWindow(e.notification.data.url).then(function() {}));
    let t = {
        type: "cl",
        ...e.notification.data.logs
    };
    console.log(t)
    let rd = await request("lg", t, "POST")
    if (rd.status) {
      return e.text()
    }
}), self.addEventListener("notificationclose", async function(e) {
  console.log("close")
    0 != notificationClicked && 0 != notificationAutoHide || (logdata = {type: "cs",...e.notification.data.logs })
    let rd = await request("lg", logdata , "POST")
    if (rd.status) {
      return e.text()
    }
});