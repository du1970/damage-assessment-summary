/*
 * Copyright 2015 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  'dojo/dom-construct',
  "dojo/store/Memory",
  'dojo/dom-class',
  "dijit/form/CheckBox",
  "dgrid/OnDemandList",
  "dgrid/Selection",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojox/form/CheckedMultiSelect",
  "esri/opsdashboard/WidgetConfigurationProxy",
  "dojo/text!./DamageAssessmentSummaryWidgetConfigTemplate.html",
  "dojo/parser"
], function (declare, lang, domConstruct, Memory, domClass, CheckBox, List, Selection, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, CheckedMultiSelect, WidgetConfigurationProxy, templateString) {

  return declare("DamageAssessmentSummaryWidgetConfig", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, WidgetConfigurationProxy], {
    templateString: templateString,

    postCreate: function () {
      this.inherited(arguments);
      console.log("PC");
    },

    dataSourceSelectionChanged: function (dataSource, dataSourceConfig) {
      this.dataSourceConfig = dataSourceConfig;

      //TODO need to understand when and what all happens to the config when a datasource changes
      // also need to understand when it's ok to check the config values
      this._createTableOptions(dataSourceConfig.displayAll, dataSourceConfig.displayAlias);
      this.dataSourceConfig.selectedFieldsNames = this._createSimpleTable(dataSource);
      this._initTextBoxes(this.configListDiv.childNodes[0].rows, this.dataSourceConfig.displayAlias); 
    },

    _createTableOptions: function (displayAll, displayAlias) {

      console.log("Display All: " + displayAll);
      console.log("Display Alias: " + displayAlias);

      var dAll = typeof (displayAll) !== 'undefined' ? displayAll : false;
      this.dataSourceConfig.displayAll = dAll;
      console.log("Display All: " + dAll);

      var dAlias = typeof (displayAlias) !== 'undefined' ? displayAlias : true;
      this.dataSourceConfig.displayAlias = dAlias;
      console.log("Display Alias: " + dAlias);

      //Display All Option
      domConstruct.create('input', {
        type: "checkbox",
        id: "displayAll",
        checked: dAll,
        className: "optionsCheckbox",
        onclick: lang.hitch(this, function (v) {
          this.dataSourceConfig.displayAll = v.target.checked;
          var rows = this.configListDiv.childNodes[0].rows;
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var cbCell = row.cells[0];
            cbCell.childNodes[0].click();
          }
          this.readyToPersistConfig(true);
        })
      }, this.configListDivOptions);

      domConstruct.create('label', {
        innerHTML: "Display All Fields",
        className: "optionsLabel",
        "for": "displayAll"
      }, this.configListDivOptions);

      //Display Field Alias Option
      domConstruct.create('input', {
        type: "checkbox",
        id: "displayAlias",
        checked: dAlias,
        className: "optionsCheckbox",
        onclick: lang.hitch(this, function (v) {
          this.dataSourceConfig.displayAlias = v.target.checked;
          var rows = this.configListDiv.childNodes[0].rows;
          this._initTextBoxes(rows, v.target.checked);
          this.readyToPersistConfig(true);
        })
      }, this.configListDivOptions);

      domConstruct.create('label', {
        innerHTML: "Display Field Alias",
        className: "optionsLabel",
        "for": "displayAll"
      }, this.configListDivOptions);
    },

    _initTextBoxes: function (rows, v) {
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        row.cells[1].childNodes[0].disabled = !v;
      }
    },

    _createSimpleTable: function (dataSource) {
      var table = domConstruct.create('table', {
        className: "tableTest"
      }, this.configListDiv);

      var idx = 0;
      var row;
      //var header = table.createTHead();
      //var row = header.insertRow(idx);

      //this._insertCell(row, "Display", 0);
      //this._insertCell(row, "Field Alias", 1);
      //this._insertCell(row, "Field Name", 2);

      //I Guess I will load from the config if it's defiend
      //and remove from this copy if it's found...so I know what ones are left

      console.log("starting field work..................");
      var dsFields = lang.clone(dataSource.fields);
      console.log(dsFields);
      fieldLoop:
        for (var k in dsFields) {
          var f = dsFields[k];
          if (f.type !== "esriFieldTypeString" &&
              f.type !== "esriFieldTypeSmallInteger" &&
              f.type !== "esriFieldTypeInteger" &&
              f.type !== "esriFieldTypeSingle" &&
              f.type !== "esriFieldTypeDouble") {
            dsFields.splice(i, 1);
            console.log("Removing field: " + f.name + " " + f.type);
          }
        }
      console.log(dsFields);
      var currentItems = [];
      if (this.dataSourceConfig.selectedFieldsNames) {
        for (var key in this.dataSourceConfig.selectedFieldsNames) {
          var persistField = this.dataSourceConfig.selectedFieldsNames[key];
          console.log(persistField);
          row = table.insertRow(idx);
          row.myIndex = idx;
          console.log("Setting persisted index: " + idx);
          console.log(row);

          var checked = persistField.checked;
          var displayName = persistField.displayName;
          var name = persistField.name;
          console.log("Inserting persisted index: " + idx);
          currentItems.splice(idx, 0, {
            checked: checked,
            displayName: displayName,
            name: name,
            indexInTable: idx
          });

          configFieldLoop:
            for (var i = 0; i < dsFields.length; i++) {
              if (dsFields[i].name === name) {
                dsFields.splice(i, 1);
                console.log("remove: " + name);
                break configFieldLoop;
              }
            }
          console.log("inserting row: " + row);
          this._insertCell(row, checked, 0);
          this._insertCell(row, displayName, 1);
          this._insertCell(row, name, 2);
          console.log("inserted row: " + row);
          idx += 1;
        }
      } else {
        dataSource.fields.forEach(lang.hitch(this, function (field) {
          console.log("Setting myIndex: " + idx);
          switch (field.type) {
            case "esriFieldTypeString":
            case "esriFieldTypeSmallInteger":
            case "esriFieldTypeInteger":
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
              row = table.insertRow(idx);
              row.myIndex = idx;
              var checked = false;
              var displayName = field.alias;
              console.log("Inserting index: " + idx);
              currentItems.splice(idx, 0, {
                checked: checked,
                displayName: displayName,
                name: field.name,
                indexInTable: idx
              });
              console.log("inserting row: " + row);
              this._insertCell(row, checked, 0);
              this._insertCell(row, displayName, 1);
              this._insertCell(row, field.name, 2);
              console.log("inserted row: " + row);
              idx += 1;
              console.log("Incrementing index: " + idx);
              return;
          }
        }));
      }

      return currentItems;
    },

    _insertCell: function (row, v, idx) {
      var cell = row.insertCell(idx);
      if (idx === 0) {
        domConstruct.create('input', {
          type: "checkbox",
          checked: v,
          onclick: lang.hitch(this, function (b) {
            var row = b.target.parentElement.parentElement;
            var fieldName = row.cells[2].childNodes[0].textContent;
            this._updateList(row, fieldName, row.myIndex);
          })
        }, cell);
      } else if (idx === 1) {
        domConstruct.create('input', {
          value: v,
          oninput: lang.hitch(this, function (e) {
            var row = e.srcElement.parentElement.parentElement;
            var fieldName = row.cells[2].childNodes[0].textContent;
            this._updateList(row, fieldName, row.myIndex)
          })
        }, cell);
      } else if (idx === 2) {
        var l = domConstruct.create('label', {
          innerHTML: v
        }, cell);
      }
    },

    _updateList: function (row, fieldName, index) {
      //update the persisted values for the config
      var persistedNames = this.dataSourceConfig.selectedFieldsNames;
      for (var i = 0; i < persistedNames.length; i++) {
        if (persistedNames[i].name === fieldName) {
          persistedNames.splice(i, 1);
          break;
        }
      }

      persistedNames.splice(index, 0, {
        checked: row.cells[0].childNodes[0].checked,
        displayName: row.cells[1].childNodes[0].value,
        name: fieldName,
        indexInTable: index
      });

      this.readyToPersistConfig(Array.isArray(persistedNames) && persistedNames.length > 0);
    },

    onSelectionChanged: function (value) {
      //TODO this is out of sync and needs to be updated
      if (!this.dataSourceConfig)
        return;

      this.dataSourceConfig.selectedFieldsNames = value;
      this.readyToPersistConfig(Array.isArray(value) && value.length > 0);
    },

    rowClicked: function (evt) {
      var t = evt.target.nextElementSibling;
      if (domClass.contains(t, "rowOff")) {
        domClass.remove(t, "rowOff");
        domClass.add(t, "rowOn");
      } else {
        domClass.remove(t, "rowOn");
        domClass.add(t, "rowOff");
      }
    }
  });
});















