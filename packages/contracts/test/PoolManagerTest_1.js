const deploymentHelpers = require("../utils/deploymentHelpers.js")
const testHelpers = require("../utils/testHelpers.js")

const deployLiquity = deploymentHelpers.deployLiquity
const truffleDeployLiquity = deploymentHelpers.truffleDeployLiquity
const getAddresses = deploymentHelpers.getAddresses
const connectContracts = deploymentHelpers.connectContracts

const mv = testHelpers.MoneyValues
const dec = testHelpers.TestHelper.dec

contract('PoolManager', async accounts => {
  const [owner, mockCDPManagerAddress, mockBorrowerOperationsAddress, mockPoolManagerAddress, alice, whale] = accounts;
  let priceFeed
  let clvToken
  let poolManager
  let sortedCDPs
  let cdpManager
  let nameRegistry
  let activePool
  let stabilityPool
  let defaultPool
  let functionCaller
  let borrowerOperations

  beforeEach(async () => {
    const contracts = await deployLiquity()
   
    priceFeed = contracts.priceFeed
    clvToken = contracts.clvToken
    poolManager = contracts.poolManager
    sortedCDPs = contracts.sortedCDPs
    cdpManager = contracts.cdpManager
    nameRegistry = contracts.nameRegistry
    activePool = contracts.activePool
    stabilityPool = contracts.stabilityPool
    defaultPool = contracts.defaultPool
    functionCaller = contracts.functionCaller
    borrowerOperations = contracts.borrowerOperations

    const contractAddresses = getAddresses(contracts)
    await connectContracts(contracts, contractAddresses)

    await poolManager.setBorrowerOperations(mockBorrowerOperationsAddress, { from: owner })
    await poolManager.setCDPManager(mockCDPManagerAddress, { from: owner })
  })

  // Getters and setters
  it('borrowerOperationsAddress(): sets and gets the cdpManager address', async () => {
    const recordedBOAddress = await poolManager.borrowerOperationsAddress({ from: mockBorrowerOperationsAddress })
    assert.equal(mockBorrowerOperationsAddress, recordedBOAddress)
  })

  it('borrowerOperationsAddress(): sets and gets the cdpManager address', async () => {
    const recordedCDPMAddress = await poolManager.cdpManagerAddress({ from: mockCDPManagerAddress })
    assert.equal(mockCDPManagerAddress, recordedCDPMAddress)
  })

  it('getActiveDebt(): returns the total CLV balance of the ActivePool', async () => {
    const actualActiveDebt = await activePool.getCLVDebt({ from: poolManager.address })
    const returnedActiveDebt = await poolManager.getActiveDebt()
    assert.equal(actualActiveDebt.toNumber(), returnedActiveDebt.toNumber())
  })

  it('getActiveColl(): returns the total ETH balance of the ActivePool', async () => {
    const actualActiveColl = (await activePool.getETH({ from: poolManager.address })).toNumber()
    const returnedActiveColl = (await poolManager.getActiveColl()).toNumber()
    assert.equal(actualActiveColl, returnedActiveColl)
  })

  it('getLiquidatedColl(): returns the total ETH balance of the DefaultPool', async () => {
    const actualActiveColl = (await defaultPool.getETH({ from: poolManager.address })).toNumber()
    const returnedActiveColl = (await poolManager.getLiquidatedColl()).toNumber()
    assert.equal(actualActiveColl, returnedActiveColl)
  })

  it('addColl(): increases the raw ether balance of the ActivePool by the correct amount', async () => {
    const activePool_RawBalance_Before = await web3.eth.getBalance(activePool.address)
    assert.equal(activePool_RawBalance_Before, 0)

    await poolManager.addColl({ from: mockBorrowerOperationsAddress, value: dec(1, 'ether') })

    const activePool_RawBalance_After = await web3.eth.getBalance(activePool.address)
    assert.equal(activePool_RawBalance_After, dec(1, 'ether'))
  })

  it('addColl(): increases the recorded ETH balance of the ActivePool by the correct amount', async () => {
    // check ETH record before
    const activePool_ETHBalance_Before = await activePool.getETH({ from: poolManager.address })
    assert.equal(activePool_ETHBalance_Before, 0)

    // send coll, called by cdpManager
    await poolManager.addColl({ from: mockBorrowerOperationsAddress, value: dec(1, 'ether') })

    // check EtH record after
    const activePool_ETHBalance_After = await activePool.getETH({ from: poolManager.address })
    assert.equal(activePool_ETHBalance_After, dec(1, 'ether'))
  })

  it('withdrawColl(): decreases the raw ether balance of ActivePool', async () => {
    // --- SETUP ---
    // give activePool 2 ether
    const activePool_initialBalance = await web3.eth.getBalance(activePool.address)
    assert.equal(activePool_initialBalance, 0)
    await activePool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
    await web3.eth.sendTransaction( {to: activePool.address, from: mockPoolManagerAddress, value: dec(2, 'ether') })
    // reconnect activePool to the real poolManager
    await activePool.setPoolManagerAddress(poolManager.address, { from: owner })

    // --- TEST ---
    // check raw ether balances before
    const activePool_ETHBalance_BeforeTx = await web3.eth.getBalance(activePool.address)
    assert.equal(activePool_ETHBalance_BeforeTx, dec(2, 'ether'))

    //withdrawColl()
    await poolManager.withdrawColl(alice, dec(1, 'ether'), { from: mockBorrowerOperationsAddress })

    //  check  raw ether balance after
    const activePool_ETHBalance_AfterTx = await web3.eth.getBalance(activePool.address)
    assert.equal(activePool_ETHBalance_AfterTx, dec(1, 'ether'))
  })

  it('withdrawColl(): decreases the recorded ETH balance of the ActivePool by the correct amount', async () => {
    // --- SETUP ---
    // give activePool 2 ether
    const activePool_initialBalance = await web3.eth.getBalance(activePool.address)
    assert.equal(activePool_initialBalance, 0)
    // use the mockPool to set the recorded ETH balance
    await activePool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
    await web3.eth.sendTransaction( {to: activePool.address, from: mockPoolManagerAddress, value: dec(2, 'ether') })
    // reconnect activePool to the real poolManager
    await activePool.setPoolManagerAddress(poolManager.address, { from: owner })

    // --- TEST ---
    // check ETH record before
    const activePool_ETHBalance_BeforeTx = await activePool.getETH({ from: poolManager.address })
    assert.equal(activePool_ETHBalance_BeforeTx, dec(2, 'ether'))

    //withdrawColl()
    await poolManager.withdrawColl(alice, dec(1, 'ether'), { from: mockBorrowerOperationsAddress })

    // check ETH record after
    const activePool_ETHBalance_AfterTx = await activePool.getETH({ from: poolManager.address })
    assert.equal(activePool_ETHBalance_AfterTx, dec(1, 'ether'))
  })

  // TODO - extract impact on user to seperate test
  it('withdrawCLV(): increases the CLV of ActivePool and user CLV balance by the correct amount', async () => {
    // check CLV balances before
    const activePool_CLVBalance_Before = await activePool.getCLVDebt({ from: poolManager.address })
    const alice_CLVBalance_Before = await clvToken.balanceOf(alice)
    assert.equal(activePool_CLVBalance_Before, 0)
    assert.equal(alice_CLVBalance_Before, 0)

    // withdrawCLV()
    await poolManager.withdrawCLV(alice, 100, { from: mockBorrowerOperationsAddress })

    // Check CLV balances after - both should increase.
    // Outstanding CLV is issued to alice, and corresponding CLV debt recorded in activePool
    const activePool_CLVBalance_After = await activePool.getCLVDebt({ from: poolManager.address })
    const alice_CLVBalance_After = await clvToken.balanceOf(alice)

    assert.equal(activePool_CLVBalance_After, 100)
    assert.equal(alice_CLVBalance_After, 100)
  })

  it('repayCLV: decreases the CLV of ActivePool by the correct amount', async () => {
    // --- SETUP ---
    // issue CLV debt to alice and record in activePool
    await poolManager.withdrawCLV(alice, 100, { from: mockBorrowerOperationsAddress })

    const activePool_CLVBalance_Before = await activePool.getCLVDebt({ from: poolManager.address })
    const alice_CLVBalance_Before = await clvToken.balanceOf(alice)
    assert.equal(activePool_CLVBalance_Before, 100)
    assert.equal(alice_CLVBalance_Before, 100)

    // --- TEST ---
    // repayCLV()
    await poolManager.repayCLV(alice, 100, { from: mockBorrowerOperationsAddress })

    // Check repayed CLV is wiped from activePool
    const activePool_CLVBalance_After = await activePool.getCLVDebt({ from: poolManager.address })
    assert.equal(activePool_CLVBalance_After, 0)
  })

  it('repayCLV: decreases the user CLV balance by the correct amount', async () => {
    // --- SETUP ---
    // issue CLV debt to alice and record in activePool
    await poolManager.withdrawCLV(alice, 100, { from: mockBorrowerOperationsAddress })

    const activePool_CLVBalance_Before = await activePool.getCLVDebt({ from: poolManager.address })
    const alice_CLVBalance_Before = await clvToken.balanceOf(alice)
    assert.equal(activePool_CLVBalance_Before, 100)
    assert.equal(alice_CLVBalance_Before, 100)

    // --- TEST ---
    // repayCLV()
    await poolManager.repayCLV(alice, 100, { from: mockBorrowerOperationsAddress })

    // Check repayed CLV is deducted from Alice's balance
    const alice_CLVBalance_After = await clvToken.balanceOf(alice)
    assert.equal(alice_CLVBalance_After, 0)
  })


  it('liquidate(): decreases the CLV, ETH and raw ether of ActivePool by the correct amount', async () => {
    // --- SETUP ---
    // give activePool 1 ether and 200 CLV.
    await activePool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
    await web3.eth.sendTransaction( {to: activePool.address, from: mockPoolManagerAddress, value: dec(1, 'ether') })
    await activePool.increaseCLVDebt(200, { from: mockPoolManagerAddress })
    // reconnect activePool to the real poolManager
    await activePool.setPoolManagerAddress(poolManager.address, { from: owner })

    // --- TEST ---
    // activePool CLV, ETH and raw ether before
    const activePool_CLV_Before = await activePool.getCLVDebt({ from: poolManager.address })
    const activePool_ETH_Before = await activePool.getETH({ from: poolManager.address })
    const active_Pool_rawEther_Before = await web3.eth.getBalance(activePool.address)

    assert.equal(activePool_CLV_Before, 200)
    assert.equal(activePool_ETH_Before, dec(1, 'ether'))
    assert.equal(active_Pool_rawEther_Before, dec(1, 'ether'))

    // liquidate()
    await poolManager.liquidate(200, dec(1, 'ether'), { from: mockCDPManagerAddress })

    // check activePool CLV, ETH and raw ether after
    const activePool_CLV_After = await activePool.getCLVDebt({ from: poolManager.address })
    const activePool_ETH_After = await activePool.getETH({ from: poolManager.address })
    const active_Pool_rawEther_After = await web3.eth.getBalance(activePool.address)

    assert.equal(activePool_CLV_After, 0)
    assert.equal(activePool_ETH_After, 0)
    assert.equal(active_Pool_rawEther_After, 0)
  })

  it('liquidate(): increases the CLV, ETH and raw ether of DefaultPool by the correct amount', async () => {
    // --- SETUP ---
    // give activePool 1 ether and 200 CLV.
    await activePool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
    await web3.eth.sendTransaction( {to: activePool.address, from: mockPoolManagerAddress, value: dec(1, 'ether') })
    await activePool.increaseCLVDebt(200, { from: mockPoolManagerAddress })
    // reconnect activePool to the real poolManager
    await activePool.setPoolManagerAddress(poolManager.address, { from: owner })

    // --- TEST ---
    // check defaultPool CLV, ETH and raw ether before
    const defaultPool_CLV_Before = await defaultPool.getCLVDebt({ from: poolManager.address })
    const defaultPool_ETH_Before = await defaultPool.getETH({ from: poolManager.address })
    const defaultPool_rawEther_Before = await web3.eth.getBalance(defaultPool.address)

    assert.equal(defaultPool_CLV_Before, 0)
    assert.equal(defaultPool_ETH_Before, 0)
    assert.equal(defaultPool_rawEther_Before, 0)

    // liquidate()
    await poolManager.liquidate(200, dec(1, 'ether'), { from: mockCDPManagerAddress })

    // check defaultPool CLV, ETH and raw ether after
    const defaultPool_CLV_After = await defaultPool.getCLVDebt({ from: poolManager.address })
    const defaultPool_ETH_After = await defaultPool.getETH({ from: poolManager.address })
    const defaultPool_rawEther_After = await web3.eth.getBalance(defaultPool.address)

    assert.equal(defaultPool_CLV_After, 200)
    assert.equal(defaultPool_ETH_After, dec(1, 'ether'))
    assert.equal(defaultPool_rawEther_After, dec(1, 'ether'))
  })

  it('movePendingTroveRewardsToActivePool(): increases the CLV, ETH and raw ether of ActivePool by the correct amount', async () => {
    // --- SETUP ---
    // give defaultPool 1 ether and 200 CLV
    await defaultPool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
    await web3.eth.sendTransaction( {to: defaultPool.address, from: mockPoolManagerAddress, value: dec(1, 'ether') })
    await defaultPool.increaseCLVDebt(200, { from: mockPoolManagerAddress })

    // reconnect defaultPool to the real poolManager
    await defaultPool.setPoolManagerAddress(poolManager.address, { from: owner })

    // --- TEST ---
    // activePool CLV, ETH and raw ether before
    const activePool_CLV_Before = await activePool.getCLVDebt({ from: poolManager.address })
    const activePool_ETH_Before = await activePool.getETH({ from: poolManager.address })
    const active_Pool_rawEther_Before = await web3.eth.getBalance(activePool.address)

    assert.equal(activePool_CLV_Before, 0)
    assert.equal(activePool_ETH_Before, 0)
    assert.equal(active_Pool_rawEther_Before, 0)

    // moveDistributionRewardsToActivePool()
    await poolManager.movePendingTroveRewardsToActivePool(200, dec(1, 'ether'), { from: mockCDPManagerAddress })

    // check activePool CLV, ETH and raw ether after
    const activePool_CLV_After = await activePool.getCLVDebt({ from: poolManager.address })
    const activePool_ETH_After = await activePool.getETH({ from: poolManager.address })
    const active_Pool_rawEther_After = await web3.eth.getBalance(activePool.address)

    assert.equal(activePool_CLV_After, 200)
    assert.equal(activePool_ETH_After, dec(1, 'ether'))
    assert.equal(active_Pool_rawEther_After, dec(1, 'ether'))
  })

  it('movePendingTroveRewardsToActivePool(): decreases the CLV, ETH and raw ether of DefaultPool by the correct amount', async () => {
    // --- SETUP ---
    // give defaultPool 1 ether and 200 CLV
    await defaultPool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
    await web3.eth.sendTransaction( {to: defaultPool.address, from: mockPoolManagerAddress, value: dec(1, 'ether') })
    await defaultPool.increaseCLVDebt(200, { from: mockPoolManagerAddress })
    // reconnect defaultPool to the real poolManager
    await defaultPool.setPoolManagerAddress(poolManager.address, { from: owner })

    // --- TEST ---
    // check defaultPool CLV, ETH and raw ether before
    const defaultPool_CLV_Before = await defaultPool.getCLVDebt({ from: poolManager.address })
    const defaultPool_ETH_Before = await defaultPool.getETH({ from: poolManager.address })
    const defaultPool_rawEther_Before = await web3.eth.getBalance(defaultPool.address)

    assert.equal(defaultPool_CLV_Before, 200)
    assert.equal(defaultPool_ETH_Before, dec(1, 'ether'))
    assert.equal(defaultPool_rawEther_Before, dec(1, 'ether'))

    // moveDistributionRewardsToActivePool()
    await poolManager.movePendingTroveRewardsToActivePool(200, dec(1, 'ether'), { from: mockCDPManagerAddress })

    // check defaultPool CLV, ETH and raw ether after
    const defaultPool_CLV_After = await defaultPool.getCLVDebt({ from: poolManager.address })
    const defaultPool_ETH_After = await defaultPool.getETH({ from: poolManager.address })
    const defaultPool_rawEther_After = await web3.eth.getBalance(defaultPool.address)

    assert.equal(defaultPool_CLV_After, 0)
    assert.equal(defaultPool_ETH_After, 0)
    assert.equal(defaultPool_rawEther_After, 0)
  })

  describe('redeemCollateral()', async () => {
    beforeEach(async () => {
      // --- SETUP --- give activePool 10 ether and 5000 CLV, and give Alice 200 CLV
      await activePool.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
      await clvToken.setPoolManagerAddress(mockPoolManagerAddress, { from: owner })
      await web3.eth.sendTransaction( {to: activePool.address, from: mockPoolManagerAddress, value: dec(10, 'ether') })
      await activePool.increaseCLVDebt(5000, { from: mockPoolManagerAddress })
      // use the mockPool to set alice's CLV Balance
      await clvToken.mint(alice, 200, { from: mockPoolManagerAddress })
      // reconnect activePool and CLVToken to the real poolManager
      await activePool.setPoolManagerAddress(poolManager.address, { from: owner })
      await clvToken.setPoolManagerAddress(poolManager.address, { from: owner })
    })

    it("redeemCollateral(): burns the received CLV from the redeemer's account", async () => {
      // check Alice's CLV balance before
      const alice_CLV_Before = await clvToken.balanceOf(alice)
      assert.equal(alice_CLV_Before, 200)

      //redeemCollateral()
      await poolManager.redeemCollateral(alice, 200, dec(1, 'ether'), { from: mockCDPManagerAddress })

      // check Alice's CLV balance before
      alice_CLV_After = await clvToken.balanceOf(alice)
      assert.equal(alice_CLV_After, 0)
    })

    it("redeemCollateral(): transfers correct amount of ether to the redeemer's account", async () => {
      // check Alice's ether balance before
      const alice_EtherBalance_Before = web3.utils.toBN(await web3.eth.getBalance(alice))

      //redeemCollateral()
      await poolManager.redeemCollateral(alice, 200, dec(1, 'ether'), { from: mockCDPManagerAddress })

      // check Alice's ether balance after
      const alice_EtherBalance_After = web3.utils.toBN(await web3.eth.getBalance(alice))

      const balanceChange = (alice_EtherBalance_After.sub(alice_EtherBalance_Before)).toString()
      assert.equal(balanceChange, dec(1, 'ether'))
    })

    it("redeemCollateral(): decreases the ActivePool ETH and CLV balances by the correct amount", async () => {
      // --- TEST ---
      // check activePool CLV, ETH and raw ether before
      const activePool_CLV_Before = await activePool.getCLVDebt({ from: poolManager.address })
      const activePool_ETH_Before = await activePool.getETH({ from: poolManager.address })
      const active_Pool_rawEther_Before = await web3.eth.getBalance(activePool.address)

      assert.equal(activePool_CLV_Before, 5000)
      assert.equal(activePool_ETH_Before, dec(10, 'ether'))
      assert.equal(active_Pool_rawEther_Before, dec(10, 'ether'))

      // redeemCollateral()
      await poolManager.redeemCollateral(alice, 200, dec(1, 'ether'), { from: mockCDPManagerAddress })

      // check activePool CLV, ETH and raw ether after
      const activePool_CLV_After = await activePool.getCLVDebt({ from: poolManager.address })
      const activePool_ETH_After = await activePool.getETH({ from: poolManager.address })
      const active_Pool_rawEther_After = await web3.eth.getBalance(activePool.address)

      assert.equal(activePool_CLV_After, 4800)
      assert.equal(activePool_ETH_After, dec(9, 'ether'))
      assert.equal(active_Pool_rawEther_After, dec(9, 'ether'))
    })
  })
})

contract('Reset chain state', async accounts => {})
