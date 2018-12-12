/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable prefer-const */
/* eslint-disable no-var */
function add(a, b) {
  return parseFloat(a) + parseFloat(b);
}

function uniqFast(arr) {
  var seen = {};
  var out = [];
  var len = arr.length;
  var j = 0;
  for (var i = 0; i < len; i++) {
    var item = arr[i];
    if (seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}

function priceWithTax(basePrice, taxRate) {
  var clnBP = parseFloat(basePrice);
  var clnTR = parseFloat(taxRate);
  return parseFloat(Math.round(clnBP * 100 * (1 + clnTR)) / 100).toFixed(2);
}

function doGet(e) {}

function doPost(e) {
  var date = decodeURIComponent(e.parameter.dt);
  var invoice = decodeURIComponent(e.parameter.iv);
  var street = decodeURIComponent(e.parameter.st);
  var city = decodeURIComponent(e.parameter.ct);
  var prov = decodeURIComponent(e.parameter.pr);
  var postal = decodeURIComponent(e.parameter.pc);
  var taxrate = decodeURIComponent(e.parameter.tr).replace('#', '%');
  var taxrateFloat = decodeURIComponent(e.parameter.trf);
  var company = decodeURIComponent(e.parameter.co);
  var bsId = decodeURIComponent(e.parameter.id);

  var options = {
    method: 'get',
    headers: {
      'X-Knack-Application-Id': '5803cd7ca2fe59e9154c96e3',
      'X-Knack-REST-API-Key': '84e10cb0-93d4-11e6-ae4f-3bccb458bbf0',
    },
    contentType: 'application/json',
  };

  var baseKnackUrl =
    'https://api.knack.com/v1/pages/scene_705/views/view_1751/records?page=1&rows_per_page=1000&filters=[{"field":"field_793","operator":"is","value":["' +
    bsId +
    '"]}]';

  var knackUrl = encodeURI(baseKnackUrl);

  var response = UrlFetchApp.fetch(knackUrl, options);
  var json = response.getContentText();
  var data = JSON.parse(json);

  var rawSales = [];
  var totalArr = [];

  for (var i = 0; i < data.records.length; i++) {
    var salePrice;

    if (data.records[i].field_1660 === '') {
      salePrice = data.records[i].field_919_raw;
      totalArr.push(data.records[i].field_919_raw);
    } else {
      salePrice = data.records[i].field_1660_raw;
      totalArr.push(data.records[i].field_1660);
    }

    rawSales.push({
      preTaxPrice: salePrice,
      unique:
        data.records[i].field_240 +
        '//' +
        data.records[i].field_1480 +
        '//' +
        data.records[i].field_239 +
        '//' +
        parseFloat(salePrice).toFixed(2),
    });
  }

  var extractUniques = rawSales.map(function(item) {
    return item.unique;
  });

  var lineItems = uniqFast(extractUniques);

  console.log(lineItems);

  var tableData = [];

  lineItems.forEach(function(saleItem) {
    var priceArr = [];

    rawSales.forEach(function(sale) {
      if (sale.unique == saleItem) {
        priceArr.push(sale.preTaxPrice);
      }
    });

    var desc = saleItem.split('//');
    var grade = desc[1].split(' ');

    if (desc[3] < 0) {
      var object = [
        desc[0], // Model Name
        grade[1], // Grade
        desc[2], // Carrier
        ' ', // Quantity
        '($' + parseFloat(desc[3] * -1).toFixed(2) + ')', // Price
        '($' + parseFloat(priceArr.reduce(add, 0) * -1).toFixed(2) + ')', // subtotal
      ];
    } else if (desc[0] === 'Shipping') {
      var object = [
        desc[0], // Model Name
        grade[1], // Grade
        desc[2], // Carrier
        ' ', // Quantity
        '$' + desc[3], // Price
        parseFloat(priceArr.reduce(add, 0)).toFixed(2), // subtotal
      ];
    } else {
      var object = [
        desc[0], // Model Name
        grade[1], // Grade
        desc[2], // Carrier
        priceArr.length, // Quantity
        '$' + desc[3], // Price
        '$' + parseFloat(priceArr.reduce(add, 0)).toFixed(2), // subtotal
      ];
    }

    tableData.push(object);
  });

  var pretax = parseFloat(totalArr.reduce(add, 0)).toFixed(2);
  var total = priceWithTax(pretax, taxrateFloat);
  var taxamt = parseFloat(total - pretax).toFixed(2);

  var templateId = '172iPN89m0d5mxBV6oWOaYSRxDn84RLA15StvU3S2arA';

  var documentId = DriveApp.getFileById(templateId)
      .makeCopy()
      .getId();
  DriveApp.getFileById(documentId).setName(invoice + ' ' + company);

  var doc = DocumentApp.openById(documentId);
  var body = doc.getBody();

  body.replaceText('{{date}}', date);
  body.replaceText('{{invoice}}', invoice);
  body.replaceText('{{company}}', company);
  body.replaceText('{{street}}', street);
  body.replaceText('{{city}}', city);
  body.replaceText('{{province}}', prov);
  body.replaceText('{{postalCode}}', postal);
  body.replaceText('{{pretaxtotal}}', pretax);
  body.replaceText('{{taxrate}}', taxrate);
  body.replaceText('{{taxamt}}', taxamt);
  body.replaceText('{{total}}', total);

  var tables = body.getTables();
  var table = tables[0];
  for (var n in tableData) {
    var tableRow = table.appendTableRow();
    for (var i in tableData[n]) {
      tableRow.appendTableCell(tableData[n][i]);
      var m = parseInt(n) + 2;
      var par = table
          .getCell(m, i)
          .getChild(0)
          .asParagraph();
      par.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
  }
  table.removeRow(1);

  doc.saveAndClose();

  var pdfFile = DriveApp.getFileById(documentId).getAs(MimeType.PDF);
  GmailApp.sendEmail(
      'wholesale@spherethat.ca',
      invoice + ' ' + company,
      'Invoice attached. Need to edit the invoice? Click this: https://docs.google.com/document/d/' +
      documentId,
      {
        attachments: [pdfFile],
        name: 'DANGER ACTION',
      }
  );
}
