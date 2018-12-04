/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/* eslint-disable prefer-const */
$(document).on('knack-view-render.view_1138', function(event, view, data) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Knack-Application-Id': '5803cd7ca2fe59e9154c96e3',
    'X-Knack-REST-API-KEY': '84e10cb0-93d4-11e6-ae4f-3bccb458bbf0',
  };

  // create OBSW textbox and button
  $('#view_1138 .kn-button-menu').after(
      '<div class="clear"><br><textarea id="obswText" rows="10" cols="50" placeholder="Scan imeis in here"></textarea></div> <br> <div><a id="bulkOBSW" class="kn-button">Bulk OBSW</a></div>'
  );

  let url = $(location)
      .attr('hash')
      .split('/');
  let invoiceID = url[3];
  let errorArr = [];
  /**
   * Recursive Post call to update associate Imei storage location & invoice#
   */

  function obswPost(reqBody, count, total, step) {
    if (count <= total) {
      let imei = reqBody[count];
      $.ajax({
        url:
          'https://api.knackhq.com/v1/pages/scene_705/views/view_1522/records?page=1&rows_per_page=1&filters=[{"field":"field_37", "operator":"is","value":"' +
          imei +
          '"}]',
        headers: headers,
        type: 'GET',
      })
          .done(function(responseA) {
            if (
              responseA.records[0] === undefined ||
            responseA.records[0] === null
            ) {
              errorArr.push(
                  reqBody[count] + ' Error 401: Could not find IMEI in Knack'
              );
              count = count + step;
              obswPost(reqBody, count, total, step);
            } else {
              let receivedID = responseA.records[0].id;
              let data = {
                field_212: 'Outbound Sale Wait',
                field_793: [invoiceID],
              };
              $.ajax({
                url:
                'https://api.knackhq.com/v1/pages/scene_715/views/view_1531/records/' +
                receivedID,
                type: 'PUT',
                headers: headers,
                data: JSON.stringify(data),
              })
                  .done(function(response) {
                    console.log(response);
                    count = count + step;
                    obswPost(reqBody, count, total, step);
                  })
                  .fail(function(jqXHR, textStatus, errorThrown) {
                    error.push(
                        reqBody[count] +
                    ' Error 502: Could not OBSW (Failed AJAX Call)'
                    );
                    alert('Could not OBSW: ' + reqBody[count]);
                    count = count + step;
                    obswPost(reqBody, count, total, step);
                  });
            }
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            error.push(
                reqBody[count] +
              ' Error 501: Could not find IMEI (failed AJAX Call)'
            );
            count = count + step;
            obswPost(reqBody, count, total, step);
          });
    } else {
      console.log('Recursive OBSW call done');
    }
  }

  $('#bulkOBSW').click(function(event) {
    event.preventDefault();
    Knack.showSpinner();
    let imeiArr = String($('#obswText').val())
        .split('\n')
        .trim();

    obswPost(imeiArr, 0, imeiArr.length - 1, 4);
    obswPost(imeiArr, 1, imeiArr.length - 1, 4);
    obswPost(imeiArr, 2, imeiArr.length - 1, 4);
    obswPost(imeiArr, 3, imeiArr.length - 1, 4);
  });

  $(document).ajaxStop(function() {
    if (errorArr.length > 0) {
      alert('Something Went Wrong!\n' + errorArr.join('\n'));
    }
    location.reload();
  });
});

$(document).on('knack-view-render.view_1592', function(event, view, data) {
  let headers = {
    'Content-Type': 'application/json',
    'X-Knack-Application-Id': '5803cd7ca2fe59e9154c96e3',
    'X-Knack-REST-API-Key': '84e10cb0-93d4-11e6-ae4f-3bccb458bbf0',
  };

  $('#view_1592 .view-header').after(
      '<input type="submit" value="Bulk Pricer" id="bulkPricer"> &nbsp &nbsp <input type="submit" value="Log Sale" id="logSale"> &nbsp &nbsp <input type="submit" value="Generate Invoice [Dev]" id="genInvoice"><br><div id="priceTable"> </div><div id="priceSubmitCont"><br><input type="submit" id="priceSubmit" value="Batch Price Update"><br><br></div>'
  );

  $('#priceSubmitCont').hide();

  let finalSku = [];
  let data = Knack.models['view_1137'].toJSON();
  let models = Knack.models['view_1592'].data.models;

  $('#bulkPricer').click(function(event) {
    $('#priceTable').empty();
    let skuData = [];
    for (let i = 0; i < models.length; i++) {
      let skuRawString = models[i].attributes.field_12_raw +
        models[i].attributes.field_13_raw +
        models[i].attributes.field_49_raw
      
      let skuClean = skuRawString.split(' ').join('_')
      skuData.push({
        Name:
          models[i].attributes.field_12_raw +
          ' ' +
          models[i].attributes.field_13_raw +
          ' ' +
          models[i].attributes.field_49_raw,
        Sku: skuClean
        id: models[i].attributes.id,
      });
    }
    console.log(data);
    let skus = skuData.map(function(item) {
      return item.sku;
    });

    let skusUnique = Array.from(new Set(skus));

    skusUnique.forEach(function(sku) {
      let arrTemp = [];

      skuData.forEach(function(item) {
        if (item.sku === sku) {
          arrTemp.push(item.id);
        }
      });

      let object = {
        Sku: sku,
        id: arrTemp,
      };

      finalSku.push(object);
    });
    console.log(finalSku);

    let table = $('<table>').css('width', '40%');
    for (i = 0; i < skusUnique.length; i++) {
      let row = $('<tr>')
          .addClass('bar')
          .html(
              '<td>' +
            skusUnique[i] +
            '</td>' +
            '<td><input type="number" step="0.01" id="price">' +
            skusUnique[i] +
            '"></td>'
          );
      table.append(row);
    }
    $('#priceTable').append('<br>');
    $('#priceTable').append(table);
    $('#priceSubmitCont').show();
  });

  $('#priceSubmit').click(function(event) {
    // Could be unstable if too many individual SKUs // future refractor to
    function batchOverridePrice(itemData, priceData, i, count) {
      Knack.showSpinner();
      let id = itemData.id[i];

      $.ajax({
        url:
          'https://api.knackhq.com/v1/pages/scene_740/views/view_1625/records/' +
          id,
        headers: headers,
        type: 'PUT',
        data: JSON.stringify(priceData),
      }).then(function(response) {
        if (i < count) {
          i = i + 1;
          batchOverridePrice(itemData, priceData, i, count);
        } else {
          console.log('Recursive Api call done');
        }
      });
    }

    finalSku.forEach(function(item) {
      newPrice = $('input#price' + item.Sku).val();
      if (newPrice === '') {
        console.log(item.Sku + ' has no override price assigned');
      } else {
        let total = item.id.length - 1;
        let priceObj = {
          field_1660: newPrice,
        };
        batchOverridePrice(item, priceObj, 0, total);
      }
    });
  });

  $('#logSale').click(function(event) {
    function priceWithTax(basePrice, taxRate) {
      let clnBP = parseFloat(basePrice);
      let clnTR = parseFloat(taxRate);
      return Math.round(clnBP * 100 * (1 + clnTR)) / 100;
    }

    if (confirm('Good to go?')) {
      let saleData = [];

      models.forEach(function(order) {
        let salePrice;

        if (order.attributes.field_1660 === '') {
          salePrice = priceWithTax(
              order.attributes.field_919_raw,
              data.field_526_raw
          );
        } else {
          salePrice = priceWithTax(
              order.attributes.field_1660,
              data.field_526_raw
          );
        }

        saleData.push({
          field_54: [order.id], // imei
          field_53: 'Wholesale', // Sold Category
          field_1164: [data.id], // Bulk Sale ID
          field_55: data.field_978_raw[0].identifier, // reference/location
          field_551: [data.field_978_raw[0].id], // wholesale buyer
          field_56: data.field_1202, // Sale Date
          field_57: salePrice, // Sale Price
          field_74: data.field_1191, // Currency
          field_108: data.field_1195_raw, // Tax Treatment string
        });
      });

      let total = models.length - 1;

      salePost(saleData, 0, total, 4);
      salePost(saleData, 1, total, 4);
      salePost(saleData, 2, total, 4);
      salePost(saleData, 3, total, 4);
    } else {
    }
  });
});

$(document).on('knack-view-render.view_1643', function(event, view, data) {
  let data = Knack.models['view_1137'].toJSON();

  let today = new Date();
  let months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  let dateClean =
    months[today.getMonth()] +
    ' ' +
    today.getDate() +
    ', ' +
    today.getFullYear();

  $('#view_1643 ul').append(
      '<li class="kn-button"><a href="#" id="createInvoice"><span>Create Invoice</span></a></li><li class="kn-button"><a href="#" id="addShipping"><span>Add Shipping Cost</span></a></li>'
  );

  $('#createInvoice').click(function(event) {
    event.preventDefault();
    Knack.showSpinner();
    function justTax(basePrice, taxRate) {
      let clnBP = parseFloat(basePrice);
      let clnTR = parseFloat(taxRate);
      return parseFloat(
          Math.round(clnBP * 100 * (clnTR / (1 + clnTR))) / 100
      ).toFixed(2);
    }

    function justSale(basePrice, taxRate) {
      let clnBP = parseFloat(basePrice);
      let clnTR = parseFloat(taxRate);
      return parseFloat(
          Math.round(clnBP * 100 * (1 / (1 + clnTR))) / 100
      ).toFixed(2);
    }

    let date = encodeURIComponent(dateClean);
    let invoice = encodeURIComponent(data.field_665_raw);
    let company = encodeURIComponent(data.field_978_raw[0].identifier);
    let street = encodeURIComponent(
        data.field_505_raw.street + ' ' + data.field_505_raw.street2
    );
    let city = encodeURIComponent(data.field_505_raw.city);
    let province = encodeURIComponent(data.field_505_raw.state);
    let postal = encodeURIComponent(data.field_505_raw.zip);
    let subtotal = encodeURIComponent(
        justSale(data.field_1179_raw, data.field_526_raw)
    );
    let totaltaxamount = encodeURIComponent(
        justTax(data.field_1179_raw, data.field_526_raw)
    );
    let grandtotal = encodeURIComponent(
        parseFloat(data.field_1179_raw).toFixed(2)
    );
    let taxratefloat = encodeURIComponent(
        parseFloat(data.field_526_raw).toFixed(2)
    );

    let pageUrlHash = $(location)
        .attr('hash')
        .split('/');
    let invoiceID = pageUrlHash[3];

    // google scripts can't decode "%" symbol for some reason. Sub in # and sub out later
    let taxrate = encodeURIComponent(data.field_1195_raw.replace('%', '#'));

    // Generate a composite URL with the static info
    let url =
      'https://script.google.com/a/spherethat.ca/macros/s/AKfycbyhJEaqmh1WQh_BfjHBBxPh20JDzzxNUnFRdjhFTA/exec?dt=' +
      date +
      '&iv=' +
      invoice +
      '&st=' +
      street +
      '&ct=' +
      city +
      '&pr=' +
      province +
      '&pc=' +
      postal +
      '&pt=' +
      subtotal +
      '&tr=' +
      taxrate +
      '&ta=' +
      totaltaxamount +
      '&tt=' +
      grandtotal +
      '&co=' +
      company +
      '&id=' +
      invoiceID +
      '&trf=' +
      taxratefloat;
    // console.log(url)
    $.post(url);
  });

  $('#addShipping').click(function(event) {
    event.preventDefault();
    alert('still in Dev');
  });
});
