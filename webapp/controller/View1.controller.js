sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem"
], function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    BusyIndicator,
    SelectDialog,
    StandardListItem
) {
    "use strict";

    return Controller.extend("pmnotificationclosing.controller.View1", {

        onInit: function () {
            var oViewModel = new JSONModel(this._getInitialData());
            this.getView().setModel(oViewModel, "viewModel");
            this._setDefaultDateTime();
        },

        _getInitialData: function () {
            return {
                busy: false,

                Mobid: "Sap.abap@jbmgroup.com", 
                Notinum: "",
                Msgrp: "",
                Edate: "",
                Etime: "",
                Urtxt: "",

                QMNUM: "",
                QMART: "",
                QMTXT: "",
                EQUNR: "",
                EQKTX: "",
                ERDAT: "",
                AUSVN: "",
                AUZTV: "",
                MSAUS: "",
                IWERK: "",
                INGRP: "",
                Success: "",
                Message: "",

                showDetails: false
            };
        },

        _getLoggedInUser: function () {
            try {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser()) {
                    var sUser = sap.ushell.Container.getUser().getId();
                    if (sUser && sUser !== "DEFAULT_USER") {
                        return sUser.toUpperCase();
                    }
                }
            } catch (e) {
                
            }

            
            return "sap.abap@jbmgroup.com";
        },
        onNotinumLiveChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oVM = this.getView().getModel("viewModel");

            oVM.setProperty("/Notinum", sValue);
            this._hideDetails();
        },

        
        // F4 Help
        
        onValueHelpNoti: function () {
            debugger;
            var oView = this.getView();
            var oModel = oView.getModel();

            if (!this._oNotiVH) {
                this._oNotiVH = new SelectDialog({
                    title: "Select Notification Number",
                    noDataText: "No Notifications Found",

                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oBinding = oEvent.getSource().getBinding("items");

                        if (sValue) {
                            oBinding.filter([
                                new Filter("Notinum", FilterOperator.Contains, sValue)
                            ]);
                        } else {
                            oBinding.filter([]);
                        }
                    },

                    confirm: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("selectedItem");
                        if (oSelectedItem) {
                            var oObj = oSelectedItem.getBindingContext().getObject();
                            this.getView().getModel("viewModel").setProperty("/Notinum", oObj.Notinum || "");
                            this._hideDetails();
                        }
                    }.bind(this)
                });

                this._oNotiVH.setModel(oModel);

                this._oNotiVH.bindAggregation("items", {
                    path: "/PMNotiClosingSet",
                    template: new StandardListItem({
                        title: 
                        "Notification: {Notinum}",
                         description: "Plant: {IWERK}"

                    })
                });

                oView.addDependent(this._oNotiVH);
            }

            this._oNotiVH.open();
        },

        
        // Get Details
       
        onGetDetails: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oVM = oView.getModel("viewModel");

            var sNotinum = (oVM.getProperty("/Notinum") || "").trim();
            var sMobid = (oVM.getProperty("/Mobid") || "").trim();

            if (!sNotinum) {
                MessageBox.warning("Please enter Notification Number.");
                return;
            }

            if (!sMobid) {
                MessageBox.warning("Please enter User ID / Email.");
                return;
            }

            this._setBusy(true);
             debugger;
            oModel.read("/PMNotiClosingSet('" + encodeURIComponent(sNotinum) + "')", {
                success: function (oData) {
                    this._setBusy(false);

                    if (oData.Success === "F") {
                        this._hideDetails();
                        MessageBox.error(oData.Message || "Notification not found.");
                        return;
                    }
                       debugger;
                    oVM.setProperty("/Mobid", sMobid);
                    oVM.setProperty("/Notinum", oData.Notinum || sNotinum);
                    oVM.setProperty("/QMNUM", oData.QMNUM || "");
                    oVM.setProperty("/QMART", oData.QMART || "");
                    oVM.setProperty("/QMTXT", oData.QMTXT || "");
                    oVM.setProperty("/EQUNR", oData.EQUNR || "");
                    oVM.setProperty("/EQKTX", oData.EQKTX || "");
                    oVM.setProperty("/ERDAT", oData.ERDAT || "");
                    oVM.setProperty("/AUSVN", oData.AUSVN || "");
                    oVM.setProperty("/AUZTV", oData.AUZTV || "");
                    oVM.setProperty("/MSAUS", oData.MSAUS || "");
                    oVM.setProperty("/IWERK", oData.IWERK || "");
                    oVM.setProperty("/INGRP", oData.INGRP || "");
                    oVM.setProperty("/Success", oData.Success || "");
                    oVM.setProperty("/Message", oData.Message || "");

                    oVM.setProperty("/showDetails", true);

                    MessageToast.show("Notification details loaded successfully.");
                }.bind(this),

                error: function (oError) {
                    this._setBusy(false);
                    this._hideDetails();
                    MessageBox.error(this._extractErrorMessage(oError) || "Failed to fetch notification details.");
                    console.error("GET Error:", oError);
                }.bind(this)
            });
        },

       
        // Close Notification
        
        onCloseNotification: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oVM = oView.getModel("viewModel");

            var sNotinum = (oVM.getProperty("/Notinum") || "").trim();
            var sMobid = (oVM.getProperty("/Mobid") || "").trim();
            var sEdate = (oVM.getProperty("/Edate") || "").trim();
            var sEtime = (oVM.getProperty("/Etime") || "").trim();
            var sMsgrp = (oVM.getProperty("/Msgrp") || "").trim();
            var sUrtxt = (oVM.getProperty("/Urtxt") || "").trim();

            if (!sNotinum) {
                MessageBox.warning("Please enter Notification Number.");
                return;
            }

            if (!sMobid) {
                MessageBox.warning("Please enter User ID / Email.");
                return;
            }

            if (!sEdate) {
                MessageBox.warning("Please select End Date.");
                return;
            }

            if (!sEtime) {
                MessageBox.warning("Please select End Time.");
                return;
            }
            if (sMsgrp && isNaN(sMsgrp)) {
                MessageBox.warning("Room Value must be numeric.");
                return;
            }

            this._setBusy(true);

            oModel.callFunction("/CloseNotification", {
                method: "POST",
                urlParameters: {
                    Notinum: sNotinum,
                    Mobid: sMobid,
                    Edate: sEdate,
                    Etime: sEtime,
                    Msgrp: sMsgrp,
                    Urtxt: sUrtxt
                },
                success: function (oData) {
                    this._setBusy(false);

                    if (oData.Success === "S") {
                        oVM.setProperty("/Success", oData.Success || "");
                        oVM.setProperty("/Message", oData.Message || "");

                        MessageBox.success(oData.Message || "Notification closed successfully.");

                        // refresh details after close
                        this.onGetDetails();
                    } else {
                        MessageBox.error(oData.Message || "Failed to close notification.");
                    }
                }.bind(this),

                error: function (oError) {
                    this._setBusy(false);
                    MessageBox.error(this._extractErrorMessage(oError) || "Error while closing notification.");
                    console.error("Close Error:", oError);
                }.bind(this)
            });
        },
        onRoomValueChange: function (oEvent) {
            var sValue = oEvent.getParameter("value") || "";
            var sClean = sValue.replace(/[^0-9.]/g, "");

            this.getView().getModel("viewModel").setProperty("/Msgrp", sClean);
        },

        
        // Reset / Clear
        
        onResetForm: function () {
            var oVM = this.getView().getModel("viewModel");

            oVM.setProperty("/Msgrp", "");
            oVM.setProperty("/Edate", this._getTodayDate());
            oVM.setProperty("/Etime", this._getCurrentTime());
            oVM.setProperty("/Urtxt", "");

            MessageToast.show("Form reset successfully.");
        },

        onClearAll: function () {
            var oVM = this.getView().getModel("viewModel");
            var sUser = oVM.getProperty("/Mobid");

            oVM.setData(this._getInitialData());
            oVM.setProperty("/Mobid", sUser || "Sap.abap@jbmgroup.com");
            this._setDefaultDateTime();

            MessageToast.show("Screen cleared.");
        },

       
        _hideDetails: function () {
            this.getView().getModel("viewModel").setProperty("/showDetails", false);
        },

        _setBusy: function (bBusy) {
            this.getView().getModel("viewModel").setProperty("/busy", bBusy);
            if (bBusy) {
                BusyIndicator.show(0);
            } else {
                BusyIndicator.hide();
            }
        },

        _setDefaultDateTime: function () {
            var oVM = this.getView().getModel("viewModel");
            oVM.setProperty("/Edate", this._getTodayDate());
            oVM.setProperty("/Etime", this._getCurrentTime());
        },

        _getTodayDate: function () {
            var d = new Date();
            return d.getFullYear() + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                String(d.getDate()).padStart(2, "0");
        },

        _getCurrentTime: function () {
            var d = new Date();
            return String(d.getHours()).padStart(2, "0") + ":" +
                String(d.getMinutes()).padStart(2, "0") + ":" +
                String(d.getSeconds()).padStart(2, "0");
        },

        _extractErrorMessage: function (oError) {
            try {
                var sResponseText = oError && oError.responseText;
                if (sResponseText) {
                    var oErr = JSON.parse(sResponseText);
                    return oErr.error && oErr.error.message && oErr.error.message.value;
                }
            } catch (e) {
                
            }
            return "";
        }

    });
});