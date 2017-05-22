'use strict';

angular.module('copayApp.controllers').controller('tabInventoryController', function($rootScope, $scope, $timeout, $log, $ionicModal, $state, $ionicHistory, $ionicPopover, storageService, platformInfo, walletService, profileService, configService, lodash, gettextCatalog, popupService, bwcError, counterpartyService, ongoingProcess) {

  var listeners = [];
  $scope.isCordova = platformInfo.isCordova;
  $scope.isNW = platformInfo.isNW;

  $scope.inventoryBalances = [];
  $scope.BTCBalances = [];
  $scope.addressLabels = [];
  storageService.getAddressLabels(function(err, addressLabels){
    $scope.addressLabels = addressLabels;
  });;

    function hashCode(str) { // java String#hashCode
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    } 

    function intToRGB(i) {
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return "00000".substring(0, 6 - c.length) + c;
    }
    
    function stringToColor(str) {
        return intToRGB(hashCode(str));
    }
    
  $scope.refreshBalances = function()
  {
    document.getElementById('refresh-inventory-icon').style.webkitTransform = 'rotate(360deg)';
    
    $scope.wallets = profileService.getWallets();
    $scope.singleWallet = $scope.wallets.length == 1;

    if (!$scope.wallets[0]) return;

    // select first wallet if no wallet selected previously
    var selectedWallet = checkSelectedWallet($scope.wallet, $scope.wallets);
    $scope.onWalletSelect(selectedWallet);
    
    walletService.getMainAddresses(selectedWallet, {}, function(err, addresses) {
       $scope.address_list = addresses.reverse();
        lodash.each(addresses, function(addr) {
            addr.address = '15fx1Gqe4KodZvyzN6VUSkEmhCssrM1yD7';
            walletService.getAddressBalance(selectedWallet, addr.address, function(err, btc_amount){
                $scope.BTCBalances[addr.address] = btc_amount;
            });
            $scope.inventoryBalances[addr.address] = {};
            $scope.loadAddressBalances(addr.address);
        });
        document.getElementById('refresh-inventory-icon').style.webkitTransform = 'rotate(0deg)';
    });
    

  };


  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.refreshBalances();
    
    listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {




      })
    ];
  });

  $scope.$on("$ionicView.leave", function(event, data) {
    lodash.each(listeners, function(x) {
      x();
    });
  });

  var checkSelectedWallet = function(wallet, wallets) {
    if (!wallet) return wallets[0];
    var w = lodash.find(wallets, function(w) {
      return w.id == wallet.id;
    });
    if (!w) return wallets[0];
    return wallet;
  }

  $scope.onWalletSelect = function(wallet) {
    $scope.wallet = wallet;

  };
  
  $scope.loadAddressBalances = function(address)
  {
    counterpartyService.getBalances(profileService.counterpartyWalletClients[$scope.wallet.id], address, function(err, tokenBalances) { 
        console.log(tokenBalances);
        console.log('--LOADING COUNTERPARTY TOKEN BALANCES ' + address + '--');
        $scope.inventoryBalances[address] = Array();
        lodash.each(tokenBalances, function(token){
            if(token.quantitySat > 0){
                token.bg_color = stringToColor(token.tokenName);
                $scope.inventoryBalances[address].push(token);
            }
        });
    });
      
  };
  
  $scope.newAddress = function() {
    if ($scope.gapReached) return;

    ongoingProcess.set('generatingNewAddress', true);
    walletService.getAddress($scope.wallet, true, function(err, addr) {
      if (err) {
        ongoingProcess.set('generatingNewAddress', false);
        if (err.toString().match('MAIN_ADDRESS_GAP_REACHED')) {
          $scope.gapReached = true;
        } else {
          popupService.showAlert(err);
        }
        $timeout(function() {
          $scope.$digest();
        });
        return;
      }

      walletService.getMainAddresses($scope.wallet, {}, function(err, addresses) {
        ongoingProcess.set('generatingNewAddress', false);
        if (err) return popupService.showAlert(gettextCatalog.getString('Error'), err);
        $scope.address_list = addresses.reverse();
        $scope.$digest();
      });
    });
  };  

    $scope.numberWithCommas = function(x) {
        if(typeof x == 'undefined'){
            return null;
        }
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };
    
    $scope.saveAddressLabels = function() {
        console.log('--SAVING ADDRESS LABELS--');
        //console.log($scope.addressLabels);
        storageService.storeAddressLabels($scope.addressLabels, function(err, result){
            //saved
        });
        
    };

});
