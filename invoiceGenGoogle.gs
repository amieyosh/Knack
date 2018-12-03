/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable prefer-const */
/* eslint-disable no-var */

function add(a, b) {
  return parseFloat(a) + parseFloat(b);
}

function uniq_fast(a) {
  var seen = {};
  var out = [];
  var len = a.length;
  var j = 0;
  for (var i = 0; i < len; i++) {
    var item = a[i];
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
  return Math.round(clnBP * 100 * (1 + clnTR)) / 100;
}

function doGet(e) {}

function doPost(e) {
  var date = decodeURIComponent(e.parameter.dt);
  var invoice = decodeURIComponent(e.parameter.iv);
  var street = decodeURIComponent(e.parameter.st);
  var city = decodeURIComponent(e.parameter.ct);
  var prov = decodeURIComponent(e.parameter.pr);
  var postal = decodeURIComponent(e.parameter.pc);
  var pretax = decodeURIComponent(e.parameter.pt);
  var taxrate = decodeURIComponent(e.parameter.tr).replace('#', '%');
  var taxrateFloat = decodeURIComponent(e.parameter.trf);
  var taxamt = decodeURIComponent(e.parameter.ta);
  var total = decodeURIComponent(e.parameter.tt);
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

  for (var i = 0; i < data.records.length; i++) {
    var salePrice;

    if (data.records[i].field_1660 === '') {
      salePrice = priceWithTax(data.records[i].field_919_raw, taxrateFloat);
    } else {
      salePrice = priceWithTax(data.records[i].field_1660_raw, taxrateFloat);
    }

    rawSales.push({
      model: data.records[i].field_241,
      condition: data.records[i].field_464,
      carrier: data.records[i].field_243,
      preTaxPrice: parseFloat(data.records[i].field_1717_raw).toFixed(2),
      Price: parseFloat(data.records[i].field_57_raw).toFixed(2),
      unique:
        data.records[i].field_241 +
        '//' +
        data.records[i].field_464 +
        '//' +
        data.records[i].field_243 +
        '//' +
        parseFloat(data.records[i].field_1717_raw).toFixed(2),
      identifier: data.records[i].field_54_raw[0].identifier,
    });
  }

  var extractUniques = rawSales.map(function(item) {
    return item.unique;
  });

  var lineItems = uniq_fast(extractUniques);

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

    var object = [
      desc[0], // Model Name
      grade[1], // Grade
      desc[2], // Carrier
      priceArr.length, // Quantity
      '$' + desc[3], // Price
      '$' + parseFloat(priceArr.reduce(add, 0)).toFixed(2), // subtotal
    ];

    tableData.push(object);
  });

  var templateId = '1ieHeKNczevTZxZ38-Nh4PiAhFMZN0Wg0Im8cv35oX44';

  var documentId = DriveApp.getFileById(templateId)
      .makeCopy()
      .getId();
  DriveApp.getFileById(documentId).setName(invoice + ' ' + company);

  var body = DocumentApp.openById(documentId).getBody();

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
}
