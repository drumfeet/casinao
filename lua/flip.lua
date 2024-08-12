local bint = require('.bint')(256)
local ao = require('ao')
local json = require('json')

local utils = {
    add = function(a, b)
        return tostring(bint(a) + bint(b))
    end,
    subtract = function(a, b)
        return tostring(bint(a) - bint(b))
    end,
    toBalanceValue = function(a)
        return tostring(bint(a))
    end,
    toNumber = function(a)
        return bint.tonumber(a)
    end,
    toFixed = function(num)
        return string.format("%.0f", num)
    end
}

TOKEN_PROCESS_ID = "ki0uYcueccVW5AjpfdcJqS5yHVtiVTXz855dbnzwWBI"
BASE_UNIT = BASE_UNIT or 10
Denomination = Denomination or 12
Flippers = Flippers or {}
Ticker = Ticker or 'FLIP'
OldRandomSeed = OldRandomSeed or 1984

local multiplyByPower = function(v)
    return v * (BASE_UNIT ^ Denomination)
end

local divideByPower = function(v)
    return v / (BASE_UNIT ^ Denomination)
end

local sendErrorMessage = function(msg, err)
    ao.send({ Target = msg.From, Error = true, Data = err })
end

Handlers.add('airdrop', Handlers.utils.hasMatchingTag('Action', 'Airdrop'), function(msg)
    --  If account is not on the Flippers list, then send an airdrop
    if not Flippers[msg.From] then
        local AMOUNT = 1000
        Flippers[ao.id] = utils.subtract(Flippers[ao.id], utils.toBalanceValue(multiplyByPower(AMOUNT)))
        Flippers[msg.From] = utils.toBalanceValue(multiplyByPower(AMOUNT))
        print(msg.From .. " " .. "Your Game Balance is now " .. Flippers[msg.From] .. " " .. Ticker)
        ao.send({
            Target = msg.From,
            Error = false,
            Amount = utils.toBalanceValue(multiplyByPower(AMOUNT)),
            Ticker = Ticker,
            Account = msg.From,
            Data = "You received an airdrop"
        })
    else
        print(msg.From .. " " .. "Airdrop Request Invalid")
        ao.send({ Target = msg.From, Error = true, Data = "Airdrop Request Invalid" })
    end
end)

Handlers.add('balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(msg)
    local bal = '0'

    -- If not Recipient is provided, then return the Senders balance
    if (msg.Tags.Recipient) then
        if (Flippers[msg.Tags.Recipient]) then
            bal = Flippers[msg.Tags.Recipient]
        end
    elseif msg.Tags.Target and Flippers[msg.Tags.Target] then
        bal = Flippers[msg.Tags.Target]
    elseif Flippers[msg.From] then
        bal = Flippers[msg.From]
    end

    ao.send({
        Target = msg.From,
        Balance = bal,
        Ticker = Ticker,
        Account = msg.Tags.Recipient or msg.From,
        Data = bal
    })
end)

Handlers.add('balances', Handlers.utils.hasMatchingTag('Action', 'Balances'),
    function(msg)
        ao.send({ Target = msg.From, Data = json.encode(Flippers) })
    end)

Handlers.add('Credit-Notice', Handlers.utils.hasMatchingTag('Action', 'Credit-Notice'), function(msg)
    local printOutput = function(account)
        local _data = {
            Action = "Credit-Notice",
            Quantity = msg.Tags.Quantity,
            From = msg.From,
            Sender = msg.Tags.Sender,
            BlockHeight = msg["Block-Height"],
            Timestamp = msg["Timestamp"],
            Balance = account,
        }
        print(_data)
    end

    if msg.From == TOKEN_PROCESS_ID then
        if msg.Tags.Sender == msg.From then
            local currentVal = Flippers[ao.id] or "0"
            Flippers[ao.id] = utils.add(currentVal, msg.Tags.Quantity)
            printOutput(Flippers[ao.id])
        else
            local currentVal = Flippers[msg.Tags.Sender] or "0"
            Flippers[msg.Tags.Sender] = utils.add(currentVal, msg.Tags.Quantity)
            printOutput(Flippers[msg.Tags.Sender])
        end
    else
        ao.send({
            Target = msg.From, -- user token PROCESS_ID
            Action = "Transfer",
            Recipient = msg.Tags.Sender,
            Quantity = msg.Tags.Quantity,
        })
        ao.send({
            Target = msg.Tags.Sender,
            Data = "Invalid token received",
        })
    end
end)

Handlers.add('withdraw', Handlers.utils.hasMatchingTag('Action', 'Withdraw'), function(msg)
    if type(msg.Quantity) ~= 'string' then
        sendErrorMessage(msg, 'Quantity is required and must be a string')
        return
    end

    if utils.toNumber(msg.Quantity) <= 0 then
        sendErrorMessage(msg, 'Quantity must be greater than 0')
        return
    end

    if not Flippers[msg.From] then
        sendErrorMessage(msg, 'Account does not exist')
        return
    end

    if utils.toNumber(Flippers[msg.From]) < utils.toNumber(msg.Quantity) then
        sendErrorMessage(msg, 'Insufficient funds')
        return
    end

    ao.send({
        Target = TOKEN_PROCESS_ID,
        Action = "Transfer",
        Recipient = msg.From,
        Quantity = msg.Quantity,
    })
    Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Tags.Quantity)
end)

Handlers.add('flip.bet', Handlers.utils.hasMatchingTag('Action', 'FlipBet'), function(msg)
    if type(msg.Quantity) ~= 'string' then
        sendErrorMessage(msg, 'Quantity is required and must be a string')
        return
    end

    if utils.toNumber(msg.Quantity) <= 0 then
        sendErrorMessage(msg, 'Quantity must be greater than 0')
        return
    end

    if not Flippers[msg.From] then
        sendErrorMessage(msg, 'Account does not exist')
        return
    end

    if utils.toNumber(Flippers[msg.From]) < utils.toNumber(msg.Quantity) then
        sendErrorMessage(msg, 'Insufficient game balance')
        return
    end

    if type(msg.Tags.Slider) ~= 'string' then
        sendErrorMessage(msg, 'Slider is required and must be a string')
        return
    end

    local sliderNum = utils.toNumber(msg.Tags.Slider)
    if sliderNum < 0 or sliderNum > 100 then
        sendErrorMessage(msg, 'Slider must be between 0 and 100')
    end

    print("--------------- Start FlipBet ---------------")
    -- Generate multiple random factors for added entropy
    local randomFactor1 = math.random()
    local randomFactor2 = math.random()
    local randomFactor3 = math.random()
    local randomFactor4 = math.random()
    local blockHeightNum = utils.toNumber(msg["Block-Height"])
    local mixing = ((blockHeightNum * randomFactor1) / (OldRandomSeed + randomFactor2) * randomFactor3) + randomFactor4
    local seed = math.floor(mixing * 2 ^ 32) % 2 ^ 32
    -- Seed the random number generator with the non-deterministic seed
    math.randomseed(seed)
    OldRandomSeed = seed

    local combined = tostring(msg["Timestamp"]) .. tostring(math.floor(OldRandomSeed))
    print("combined: " .. combined)
    local length = string.len(combined)
    print("length: " .. length)
    -- Generate a random index
    local randomIndex = math.random(1, length)
    print("randomIndex: " .. randomIndex)
    -- Pick the digit at the random index
    local discardNum = tonumber(combined:sub(randomIndex, randomIndex))
    print("discardNum: " .. tostring(discardNum))
    -- Discard the first few values to avoid issues with some RNGs' initial values
    for i = 1, discardNum do
        math.random()
    end
    -- Generate a random number to determine win or loss
    local randomValue = math.random() * 100

    local SLOPE = tonumber(-0.96)
    local INTERCEPT = tonumber(98)

    local getWinChance = function() return (SLOPE * sliderNum) + INTERCEPT end
    local _winChance = getWinChance()
    print("_winChance: " .. tostring(_winChance))

    -- Check if the random value is less than the win chance
    local playerWon = randomValue < _winChance
    print("playerWon: " .. tostring(playerWon))

    local getMultiplier = function() return 1 / (_winChance / 100) end
    local _multiplier = getMultiplier()
    print("_multiplier: " .. tostring(_multiplier))
    local getProfitOnWin = function()
        return utils.toNumber(msg.Tags.Quantity) * (_multiplier - 1)
    end
    local _profitOnWin = getProfitOnWin()
    print("_profitOnWin: " .. tostring(_profitOnWin))

    -- Calculate the scaling factor
    local scale = 1e10
    -- Calculate the rounded value
    local _w = utils.toFixed(_profitOnWin / scale)
    local _profitOnWinFinal = math.floor(utils.toNumber(_w) * scale)
    print("_profitOnWinFinal: " .. _profitOnWinFinal)
    print("_profitOnWinFinal: " .. divideByPower(_profitOnWinFinal))

    local _data = {
        Action = "FlipBet",
        Quantity = msg.Quantity,
        From = msg.From,
        BlockHeight = msg["Block-Height"],
        Timestamp = msg["Timestamp"],
        WinChance = _winChance,
        Multiplier = _multiplier,
        OldRandomSeed = OldRandomSeed,
        RandomValue = randomValue,
        DiscardNum = discardNum,
        Slider = msg.Tags.Slider
    }
    print(_data)

    if playerWon then
        print(msg.From .. " PLAYER WON")
        Flippers[ao.id] = utils.subtract(Flippers[ao.id], _profitOnWinFinal)
        Flippers[msg.From] = utils.add(Flippers[msg.From], _profitOnWinFinal)
        ao.send({ Target = msg.From, Won = true, Data = "You Win!" })
    else
        print(msg.From .. " PLAYER LOST")
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Quantity)
        Flippers[ao.id] = utils.add(Flippers[ao.id], msg.Quantity)
        ao.send({ Target = msg.From, Won = false, Data = "You Lose!" })
    end
end)
