import PrivateService from '../../core/PrivateService';
import Web3Service from '../../eth/Web3Service';
import SmartContractService from '../../eth/SmartContractService';
import EthereumTokenService from '../../eth/EthereumTokenService';
import OasisOrderSell from './OasisOrderSell';
import OasisOrderBuy from './OasisOrderBuy';
import GasEstimatorService from '../../eth/GasEstimatorService';
import tokens from '../../../contracts/tokens';
import contracts from '../../../contracts/contracts';
// import testAccountProvider from '../../../src/utils/TestAccountProvider';

export default class OasisExchangeService extends PrivateService {
  static buildKovanService() {
    const service = new OasisExchangeService(),
      web3 = Web3Service.buildInfuraService(
        'kovan',
        '0xa69d30145491b4c1d55e52453cabb2e73a9daff6326078d49376449614d2f700'
      ),
      smartContractService = SmartContractService.buildTestService(web3),
      ethereumTokenService = EthereumTokenService.buildTestService(
        smartContractService
      );

    service
      .manager()
      .inject('log', smartContractService.get('log'))
      .inject('web3', smartContractService.get('web3'))
      .inject('smartContract', smartContractService)
      .inject('ethereumToken', ethereumTokenService)
      .inject(
        'gasEstimator',
        GasEstimatorService.buildTestService(smartContractService.get('web3'))
      );

    return service;
  }

  static buildTestService(privateKey = null) {
    const service = new OasisExchangeService(),
      web3 = Web3Service.buildTestService(privateKey),
      smartContractService = SmartContractService.buildTestService(web3),
      ethereumTokenService = EthereumTokenService.buildTestService(
        smartContractService
      );

    service
      .manager()
      .inject('log', smartContractService.get('log'))
      .inject('web3', smartContractService.get('web3'))
      .inject('smartContract', smartContractService)
      .inject('ethereumToken', ethereumTokenService)
      .inject(
        'gasEstimator',
        GasEstimatorService.buildTestService(smartContractService.get('web3'))
      );

    return service;
  }

  constructor(name = 'oasisExchange') {
    super(name, [
      'smartContract',
      'ethereumToken',
      'web3',
      'log',
      'gasEstimator'
    ]);
  }

  sellDai(daiAmount, tokenSymbol, minFillAmount = '0') {
    const oasisContract = this.get('smartContract').getContractByName(
      contracts.MAKER_OTC
    );
    const daiToken = this.get('ethereumToken').getToken(tokens.DAI);
    const daiAddress = daiToken.address();
    const buyTokenAddress = this.get('ethereumToken')
      .getToken(tokenSymbol)
      .address();
    const daiAmountEVM = daiToken.toEthereumFormat(daiAmount);
    const minFillAmountEVM = daiToken.toEthereumFormat(minFillAmount);
    return new OasisOrderSell(
      oasisContract.sellAllAmount(
        daiAddress,
        daiAmountEVM,
        buyTokenAddress,
        minFillAmountEVM
      ),
      this.get('web3').ethersProvider()
    );
  }

  offer(
    payAmount,
    payTokenAddress,
    buyAmount,
    buyTokenAddress,
    pos,
    overrides
  ) {
    const oasisContract = this.get('smartContract').getContractByName(
      contracts.MAKER_OTC
    );
    return oasisContract.offer(
      payAmount,
      payTokenAddress,
      buyAmount,
      buyTokenAddress,
      pos,
      overrides
    );
  }

  buyDai(daiAmount, tokenSymbol, maxFillAmount = '-1') {
    const oasisContract = this.get('smartContract').getContractByName(
      contracts.MAKER_OTC
    );
    const daiToken = this.get('ethereumToken').getToken(tokens.DAI);
    const daiAddress = daiToken.address();
    const daiAmountEVM = daiToken.toEthereumFormat(daiAmount);
    const maxFillAmountEVM = daiToken.toEthereumFormat(maxFillAmount);
    const sellTokenAddress = this.get('ethereumToken')
      .getToken(tokenSymbol)
      .address();
    return new OasisOrderBuy(
      oasisContract.buyAllAmount(
        daiAddress,
        daiAmountEVM,
        sellTokenAddress,
        maxFillAmountEVM
      ),
      this.get('web3').ethersProvider()
    );
  }
}
