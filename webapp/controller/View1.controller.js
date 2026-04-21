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

            var oVM = new JSONModel(this._getInitialData());
            this.getView().setModel(oVM, "viewModel");

            var sUser = this._getLoggedInUser();
            oVM.setProperty("/Uname", sUser);

            // SAFE header set
            var oModel = this.getView().getModel();
            if (oModel) {
                oModel.setHeaders({
                    "x-user-id": sUser
                });
            }

            this._setDefaultDateTime();
        },



        _getInitialData: function () {
            return {
                Uname: "SAP.PM@JBMGROUP.COM",
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
                WARPL: "",
                QMNAM: "",
                Success: "",
                Message: "",

                showDetails: false
            };
        },

        //  GET LOGGED USER 
        _getLoggedInUser: function () {
            try {
                if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser())  {
                    return sap.ushell.Container.getUser().getId();
                }
            } catch (e) {
                
            }
           
            return "";
        },

        // _getLoggedInUser: function () {
        //     if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser()) {
        //         return sap.ushell.Container.getUser().getId();
        //     }
        //     // ONLY for BAS / app-preview testing
        //     return "sap.pm@jbmgroup.com";
        // },
        // F4 VALUE  
       onValueHelpNoti: function () {
        
            var oView = this.getView();
            var oModel = oView.getModel();
            var oVM = oView.getModel("viewModel");
            var sUser = oVM.getProperty("/Uname");
            
            oModel.setHeaders({
                "x-user-id": sUser
            });

           

            if (!this._oNotiVH) {
                this._oNotiVH = new SelectDialog({
                title: "Select Notification Number",
                noDataText: "No Notifications Found",
                liveChange: function (oEvent) {
                    var sValue = oEvent.getParameter("value");
                    var oBinding = oEvent.getSource().getBinding("items");
                    var aFilters = [];
                    if (sValue) {
                    aFilters.push(new Filter("Notinum", FilterOperator.Contains, sValue));
                    }
                    oBinding.filter(aFilters, "Application");
                },
                confirm: function (oEvent) {
                    var oItem = oEvent.getParameter("selectedItem");
                    if (oItem) {
                    var oObj = oItem.getBindingContext().getObject();
                    oVM.setProperty("/Notinum", oObj.Notinum || "");
                    this._hideDetails();
                    }
                }.bind(this)
                });

                this._oNotiVH.setModel(oModel);
                oView.addDependent(this._oNotiVH);

                this._oNotiVH.bindAggregation("items", {
                path: "/PMNotiClosingSet",
                template: new StandardListItem({
                    title: "Notification: {Notinum}  |  Plant: {IWERK}  |  Type: {QMART}"
                })
                });
            }

            this._oNotiVH.getBinding("items").refresh(true);
            this._oNotiVH.open();
        },
       

        //  GET DETAILS 
        onGetDetails: function () {
            var oView = this.getView();
            var oVM = oView.getModel("viewModel");
            var oModel = oView.getModel();

            var sNotinum = (oVM.getProperty("/Notinum") || "").trim();

            if (!sNotinum) {
                MessageBox.warning("Please enter Notification Number.");
                return;
            }

            this._setBusy(true);

      
            oModel.read("/PMNotiClosingSet('" + encodeURIComponent(sNotinum) + "')", {

                success: function (oData) {
                    this._setBusy(false);

                    if (!oData) {
                        this._hideDetails();
                        MessageBox.error("No data returned from backend.");
                        return;
                    }

                    
                    if (oData.Success === "F") {
                        this._hideDetails();
                        MessageBox.error(oData.Message || "Notification not found / not authorized.");
                        return;
                    }

                    // Set details
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
                    oVM.setProperty("/WARPL", oData.WARPL || "");
                    oVM.setProperty("/QMNAM", oData.QMNAM || "");

                    oVM.setProperty("/showDetails", true);

                    MessageToast.show("Notification details loaded.");
                }.bind(this),

                error: function (oError) {
                    this._setBusy(false);
                    this._hideDetails();
                    MessageBox.error(this._extractErrorMessage(oError));
                }.bind(this)
            });
        },

        //  CLOSE NOTIFICATION 
        onCloseNotification: function () {
            var oView = this.getView();
            var oVM = oView.getModel("viewModel");
            var oModel = oView.getModel();

            var sNotinum = (oVM.getProperty("/Notinum") || "").trim();
            var sUname = (oVM.getProperty("/Uname") || "").trim();

            if (!sNotinum) {
                MessageBox.warning("Enter Notification Number.");
                return;
            }
            if (!sUname) {
                MessageBox.warning("User not found in Launchpad.");
                return;
            }

            this._setBusy(true);

            oModel.callFunction("/CloseNotification", {
                method: "POST",
                urlParameters: {
                    Notinum: sNotinum,
                    Uname: sUname,
                    Edate: oVM.getProperty("/Edate"),
                    Etime: oVM.getProperty("/Etime"),
                    Msgrp: oVM.getProperty("/Msgrp"),
                    Urtxt: oVM.getProperty("/Urtxt")
                },

                success: function (oData) {
                    this._setBusy(false);

                    if (!oData) {
                        MessageBox.error("No response from backend.");
                        return;
                    }

                    if (oData.Success === "F") {
                        MessageBox.error(oData.Message || "Not Authorized.");
                        return;
                    }

                    MessageBox.success(oData.Message || "Closed Successfully");

                    this._resetScreen();
                    oModel.refresh(true);
                }.bind(this),

                error: function (oError) {
                    this._setBusy(false);
                    MessageBox.error(this._extractErrorMessage(oError));
                }.bind(this)
            });
        },

        //  HELPERS 
        _hideDetails: function () {
            this.getView().getModel("viewModel").setProperty("/showDetails", false);
        },

        _setBusy: function (bBusy) {

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
            return String(d.getDate()).padStart(2, "0") + "-" +
                String(d.getMonth() + 1).padStart(2, "0") + "-" +
                d.getFullYear();
        },

        _getCurrentTime: function () {
            var d = new Date();
            return String(d.getHours()).padStart(2, "0") + ":" +
                String(d.getMinutes()).padStart(2, "0") + ":" +
                String(d.getSeconds()).padStart(2, "0");
        },

        _extractErrorMessage: function (oError) {
            
            try {
                var sText = oError && (oError.responseText || (oError.response && oError.response.body));
                if (sText) {
                   
                    try {
                        var oJson = JSON.parse(sText);
                        if (oJson && oJson.error && oJson.error.message && oJson.error.message.value) {
                            return oJson.error.message.value;
                        }
                    } catch (eJson) {
                     
                        var sMatch = /<message[^>]*>([\s\S]*?)<\/message>/i.exec(sText);
                        if (sMatch && sMatch[1]) {
                            return sMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
                        }
                    }
                }
            } catch (e) {
               
            }
            return "Backend Error.";
        },
        onResetForm: function () {
            var oVM = this.getView().getModel("viewModel");

            oVM.setProperty("/Notinum", "");
            oVM.setProperty("/Msgrp", "");
            oVM.setProperty("/Urtxt", "");

            // hide details
            oVM.setProperty("/showDetails", false);

            // reset date time again
            this._setDefaultDateTime();
        }

    });
});