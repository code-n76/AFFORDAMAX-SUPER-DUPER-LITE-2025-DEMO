var Ajax = {
  post: function (url, data, fn) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
        fn.call(this, xhr.responseText);
      }
    };
    xhr.send(data);
  },
};
var data = {};
var globalConfig = {};
var submitUrl;
var clientMac = getQueryStringKey("clientMac");
var apMac = getQueryStringKey("apMac");
var gatewayMac = getQueryStringKey("gatewayMac") || undefined;
var ssidName = getQueryStringKey("ssidName") || undefined;
var radioId = !!getQueryStringKey("radioId")
  ? Number(getQueryStringKey("radioId"))
  : undefined;
var vid = !!getQueryStringKey("vid")
  ? Number(getQueryStringKey("vid"))
  : undefined;
var originUrl = getQueryStringKey("originUrl");
var previewSite = getQueryStringKey("previewSite");

var hotspotMap = {
  3: "Voucher Access",
  5: "Local User Access",
  6: "SMS Access",
  8: "RADIUS Access",
};

var errorHintMap = {
  0: "You are now connected. Enjoy!",
  "-1": "General error.",
  "-41500": "Invalid authentication type.",
  "-41501": "Failed to authenticate.",
  "-41502": "Incorrect voucher code.",
  "-41503": "This voucher code is expired.",
  "-41504": "The traffic used by this voucher code has reached the limit.",
  "-41505": "The number of users has reached the limit.",
  "-41506": "Invalid authorization information.",
  "-41507":
    "Your authentication times out. You can get authenticated again until the next day.",
  "-41508": "The traffic used by this local user has reached the limit.",
  "-41512": "This local user is expired.",
  "-41513": "This local user is disabled.",
  "-41514": "Incorrect MAC address.",
  "-41516": "The number of users has reached the limit.",
  "-41517": "Incorrect password.",
  "-41518": "This SSID does not exist.",
  "-41519": "Invalid code.",
  "-41520": "The code is expired.",
  "-41521": "The number of users has reached the limit.",
  "-41522": "Failed to validate the code.",
  "-41523": "Failed to send verification code.",
  "-41524": "Authentication failed because the username does not exsit.",
  "-41525": "Authentication failed because of the wrong password.",
  "-41526": "Authentication failed because the client is invalid.",
  "-41527": "Authentication failed because the local user is invalid.",
};

var facebookUrl = !!apMac
  ? "/portal/fbwifi/forward?clientMac=" +
    encodeURIComponent(clientMac) +
    "&apMac=" +
    encodeURIComponent(apMac) +
    "&ssidName=" +
    encodeURIComponent(ssidName) +
    "&radioId=" +
    encodeURIComponent(radioId) +
    "&originUrl=" +
    encodeURIComponent(originUrl)
  : "/portal/fbwifi/forward?clientMac=" +
    encodeURIComponent(clientMac) +
    "&gatewayMac=" +
    encodeURIComponent(gatewayMac) +
    "&vid=" +
    encodeURIComponent(vid) +
    "&originUrl=" +
    encodeURIComponent(originUrl);

var isCommited;
function getQueryStringKey(key) {
  return getQueryStringAsObject()[key];
}
function getQueryStringAsObject() {
  var b,
    cv,
    e,
    k,
    ma,
    sk,
    v,
    r = {},
    d = function (v) {
      return decodeURIComponent(v);
    }, //# d(ecode) the v(alue)
    q = window.location.search.substring(1), //# suggested: q = decodeURIComponent(window.location.search.substring(1)),
    s = /([^&;=]+)=?([^&;]*)/g; //# original regex that does not allow for ; as a delimiter:   /([^&=]+)=?([^&]*)/g
  ma = function (v) {
    if (typeof v != "object") {
      cv = v;
      v = {};
      v.length = 0;
      if (cv) {
        Array.prototype.push.call(v, cv);
      }
    }
    return v;
  };
  while ((e = s.exec(q))) {
    b = e[1].indexOf("[");
    v = d(e[2]);
    if (b < 0) {
      k = d(e[1]);
      if (r[k]) {
        r[k] = ma(r[k]);
        Array.prototype.push.call(r[k], v);
      } else {
        r[k] = v;
      }
    } else {
      k = d(e[1].slice(0, b));
      sk = d(e[1].slice(b + 1, e[1].indexOf("]", b)));
      r[k] = ma(r[k]);
      if (sk) {
        r[k][sk] = v;
      } else {
        Array.prototype.push.call(r[k], v);
      }
    }
  }
  return r;
}
Ajax.post(
  "/portal/getPortalPageSetting",
  JSON.stringify({
    clientMac: clientMac,
    apMac: apMac,
    gatewayMac: gatewayMac,
    ssidName: ssidName,
    radioId: radioId,
    vid: vid,
    originUrl: originUrl,
  }),
  function (res) {
    res = JSON.parse(res);
    data = res.result;
    submitUrl = "/portal/auth";
    var landingUrl = data.landingUrl;
    isCommited = false;
    globalConfig = {
      authType: data.authType,
      hotspotTypes: (!!data.hotspot && data.hotspot.enabledTypes) || [],
      error: data.error || "ok",
      countryCode: (!!data.sms && data.sms.countryCode) || 1,
    };
    function pageConfigParse() {
      if (res.errorCode !== 0) {
        document.getElementById("oper-hint").style.display = "block";
        document.getElementById("oper-hint").innerHTML =
          errorHintMap[res.errorCode];
      }
      document.getElementById("hotspot-section").style.display = "none";
      document.getElementById("input-voucher").style.display = "none";
      document.getElementById("input-user").style.display = "none";
      document.getElementById("input-password").style.display = "none";
      document.getElementById("input-simple").style.display = "none";
      document.getElementById("input-phone-num").style.display = "none";
      document.getElementById("input-verify-code").style.display = "none";
      document.getElementById("button-facebook").style.display = "none";
      switch (globalConfig.authType) {
        case 0:
          window.authType = 0;
          break;
        case 1:
          document.getElementById("input-simple").style.display = "block";
          window.authType = 1;
          break;
        case 2:
          hotspotChang(2);
          window.authType = 2;
          break;
        case 7:
          document.getElementById("button-facebook").style.display = "block";
          document
            .getElementById("button-facebook")
            .addEventListener("click", function () {
              window.location.href = facebookUrl;
            });
          document.getElementById("button-login").style.display = "none";
          window.authType = 7;
          break;
        case 11:
          document.getElementById("hotspot-section").style.display = "block";
          var options = "";
          for (var i = 0; i < globalConfig.hotspotTypes.length; i++) {
            options +=
              '<option value="' +
              globalConfig.hotspotTypes[i] +
              '">' +
              hotspotMap[globalConfig.hotspotTypes[i]] +
              "</option>";
          }
          document.getElementById("hotspot-selector").innerHTML = options;
          hotspotChang(globalConfig.hotspotTypes[0]);
          window.authType = globalConfig.hotspotTypes[0];
          break;
      }
    }

    function handleSubmit() {
      var submitData = {};
      submitData["authType"] = window.authType;
      switch (window.authType) {
        case 3:
          submitData["voucherCode"] =
            document.getElementById("voucherCode").value;
          break;
        case 5:
          submitData["localuser"] = document.getElementById("username").value;
          submitData["localuserPsw"] =
            document.getElementById("password").value;
          break;
        case 1:
          submitData["simplePassword"] =
            document.getElementById("simplePassword").value;
          break;
        case 0:
          break;
        case 6:
          submitData["phone"] =
            "+" +
            document.getElementById("country-code").value +
            document.getElementById("phone-number").value;
          submitData["code"] = document.getElementById("verify-code").value;
          break;
        case 2:
        case 8:
          submitData["username"] = document.getElementById("username").value;
          submitData["password"] = document.getElementById("password").value;
          break;
        default:
          break;
      }

      if (isCommited == false) {
        submitData["clientMac"] = clientMac;
        submitData["apMac"] = apMac;
        submitData["gatewayMac"] = gatewayMac;
        submitData["ssidName"] = ssidName;
        submitData["radioId"] = radioId;
        submitData["vid"] = vid;
        if (window.authType == 2 || window.authType == 8) {
          submitUrl = "/portal/radius/auth";
          submitData["authType"] = window.authType;
        } else {
          submitData["originUrl"] = originUrl;
        }
        function doAuth() {
          Ajax.post(
            submitUrl,
            JSON.stringify(submitData).toString(),
            function (data) {
              data = JSON.parse(data);
              if (!!data && data.errorCode === 0) {
                isCommited = true;
                window.location.href = landingUrl;
                document.getElementById("oper-hint").innerHTML =
                  errorHintMap[data.errorCode];
              } else {
                document.getElementById("oper-hint").innerHTML =
                  errorHintMap[data.errorCode];
              }
            }
          );
        }
        doAuth();
      }
    }
    function hotspotChang(type) {
      document.getElementById("input-voucher").style.display = "none";
      document.getElementById("input-user").style.display = "none";
      document.getElementById("input-password").style.display = "none";
      document.getElementById("input-phone-num").style.display = "none";
      document.getElementById("input-verify-code").style.display = "none";
      document.getElementById("button-login").style.display = "block";
      window.authType = Number(type);
      switch (Number(type)) {
        case 3:
          document.getElementById("input-voucher").style.display = "block";
          break;
        case 5:
        case 2:
        case 8:
          document.getElementById("input-user").style.display = "block";
          document.getElementById("input-password").style.display = "block";
          break;
        case 6:
          document.getElementById("input-phone-num").style.display = "block";
          document.getElementById("input-verify-code").style.display = "block";
          break;
      }
    }
    globalConfig.countryCode = "+" + parseInt(globalConfig.countryCode, 10);
    document.getElementById("country-code").value = parseInt(
      globalConfig.countryCode,
      10
    );
    document
      .getElementById("hotspot-selector")
      .addEventListener("change", function () {
        var obj = document.getElementById("hotspot-selector");
        var opt = obj.options[obj.selectedIndex];
        hotspotChang(opt.value);
      });
    document
      .getElementById("button-login")
      .addEventListener("click", handleSubmit);
    document.getElementById("get-code").addEventListener("click", function (e) {
      e.preventDefault();
      var phoneNum = document.getElementById("phone-number").value;
      function sendSmsAuthCode() {
        Ajax.post(
          "/portal/sendSmsAuthCode",
          JSON.stringify({
            clientMac: clientMac,
            apMac: apMac,
            gatewayMac: gatewayMac,
            ssidName: ssidName,
            radioId: radioId,
            vid: vid,
            phone:
              "+" + document.getElementById("country-code").value + phoneNum,
          }),
          function (data) {
            data = JSON.parse(data);
            if (data.errorCode !== 0) {
              document.getElementById("oper-hint").innerHTML =
                errorHintMap[data.errorCode];
            } else {
              document.getElementById("oper-hint").innerHTML =
                "SMS has been sent successfully.";
            }
          }
        );
      }
      sendSmsAuthCode();
      document.getElementById("oper-hint").innerHTML =
        "Sending Authorization Code...";
    });
    pageConfigParse();
  }
);
