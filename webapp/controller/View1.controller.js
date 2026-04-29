sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem"
], function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
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

            this._setUserHeader(); 

            this._setDefaultDateTime();
        },

        
        _getInitialData: function () {
            return {
                Uname: "",
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
                WARPL: "",
                QMNAM: "",

                showDetails: false,
                busy: false
            };
        },

        
        _getLoggedInUser: function () {
            try {
                if (sap.ushell && sap.ushell.Container) {
                    var oUser = sap.ushell.Container.getUser();
                    if (oUser) {
                        return oUser.getEmail(); 
                    }
                }
            } catch (e) {}

           
            return "DEFAULT_USER";
        },

       
        _setUserHeader: function () {
            var oModel = this.getView().getModel();
            var sUser = this.getView().getModel("viewModel").getProperty("/Uname");

            if (oModel && sUser) {
                oModel.setHeaders({
                    "x-user-id": sUser
                });
            }

            console.log("HEADER USER:", sUser); 
        },

       
        onValueHelpNoti: function () {

            var oView = this.getView();
            var oModel = oView.getModel();

           
            this._setUserHeader();

            if (!this._oNotiVH) {
                this._oNotiVH = new SelectDialog({
                    title: "Select Notification",
                    noDataText: "No Data Found",

                    liveChange: function (oEvent) {
                        var sValue = oEvent.getParameter("value");
                        var oBinding = oEvent.getSource().getBinding("items");

                        var aFilters = [];
                        if (sValue) {
                            aFilters.push(new Filter("Notinum", FilterOperator.Contains, sValue));
                        }

                        oBinding.filter(aFilters);
                    },

                    confirm: function (oEvent) {
                        var oItem = oEvent.getParameter("selectedItem");

                        if (oItem) {
                            var oObj = oItem.getBindingContext().getObject();
                            this.getView().getModel("viewModel")
                                .setProperty("/Notinum", oObj.Notinum);

                            this._hideDetails();
                        }
                    }.bind(this)
                });

                this._oNotiVH.setModel(oModel);
                oView.addDependent(this._oNotiVH);

                this._oNotiVH.bindAggregation("items", {
                    path: "/PMNotiClosingSet",
                    template: new StandardListItem({
                        title: "Notification: {Notinum} | Plant: {IWERK} | TYPE:{QMART}"
                    })
                });
            }

           
            this._oNotiVH.getBinding("items").refresh(true);

            this._oNotiVH.open();
        },

     
        onGetDetails: function () {

            var oVM = this.getView().getModel("viewModel");
            var oModel = this.getView().getModel();

            this._setUserHeader(); 

            var sNotinum = (oVM.getProperty("/Notinum") || "").trim();

            if (!sNotinum) {
                MessageBox.warning("Enter Notification Number");
                return;
            }

            this._setBusy(true);

            oModel.read("/PMNotiClosingSet('" + encodeURIComponent(sNotinum) + "')", {

                success: function (oData) {

                    this._setBusy(false);

                    if (!oData || oData.Success === "F") {
                        this._hideDetails();
                        MessageBox.error(oData?.Message || "No Data / Unauthorized");
                        return;
                    }

                    var oVM = this.getView().getModel("viewModel");

                    oVM.setProperty("/QMNUM", oData.QMNUM);
                    oVM.setProperty("/QMART", oData.QMART);
                    oVM.setProperty("/QMTXT", oData.QMTXT);
                    oVM.setProperty("/EQUNR", oData.EQUNR);
                    oVM.setProperty("/EQKTX", oData.EQKTX);
                    oVM.setProperty("/ERDAT", oData.ERDAT);
                    oVM.setProperty("/AUSVN", oData.AUSVN);
                    oVM.setProperty("/AUZTV", oData.AUZTV);
                    oVM.setProperty("/MSAUS", oData.MSAUS);
                    oVM.setProperty("/IWERK", oData.IWERK);
                    oVM.setProperty("/WARPL", oData.WARPL);
                    oVM.setProperty("/QMNAM", oData.QMNAM);

                    oVM.setProperty("/showDetails", true);

                    MessageToast.show("Data Loaded");

                }.bind(this),

                error: function () {
                    this._setBusy(false);
                    MessageBox.error("Backend Error");
                }.bind(this)
            });
        },

        
        onCloseNotification: function () {

            var oVM = this.getView().getModel("viewModel");
            var oModel = this.getView().getModel();

            this._setUserHeader(); 

            if (!oVM.getProperty("/Notinum")) {
                MessageBox.warning("Enter Notification Number");
                return;
            }

            if (!oVM.getProperty("/Urtxt")) {
                MessageBox.warning("Enter Remarks");
                return;
            }

            this._setBusy(true);

            oModel.callFunction("/CloseNotification", {
                method: "POST",

                urlParameters: {
                    Notinum: oVM.getProperty("/Notinum"),
                    Uname: oVM.getProperty("/Uname"),
                    Edate: oVM.getProperty("/Edate"), 
                    Etime: oVM.getProperty("/Etime"),
                    Msgrp: oVM.getProperty("/Msgrp"),
                    Urtxt: oVM.getProperty("/Urtxt")
                },

                success: function (oData) {

                    this._setBusy(false);

                    if (oData?.Success === "F") {
                        MessageBox.error(oData.Message);
                        return;
                    }

                    MessageBox.success(oData?.Message || "Closed Successfully");

                    this._resetScreen();
                    this.getView().getModel().refresh(true);

                }.bind(this),

                error: function () {
                    this._setBusy(false);
                    MessageBox.error("Close Failed");
                }.bind(this)
            });
        },

        
        _setBusy: function (bBusy) {
            this.getView().getModel("viewModel").setProperty("/busy", bBusy);
        },

        _hideDetails: function () {
            this.getView().getModel("viewModel").setProperty("/showDetails", false);
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

        _resetScreen: function () {
            var oVM = this.getView().getModel("viewModel");

            oVM.setProperty("/Notinum", "");
            oVM.setProperty("/Msgrp", "");
            oVM.setProperty("/Urtxt", "");
            oVM.setProperty("/showDetails", false);

            this._setDefaultDateTime();
        }

    });
});