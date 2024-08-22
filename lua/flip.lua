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
    end
}

TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
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

local sendErrorMessage = function(msg, err, target)
    if not target then
        ao.send({ Target = msg.From, Error = true, Data = err })
    else
        ao.send({ Target = target, Error = true, Data = err })
    end
end

Handlers.add('airdrop', Handlers.utils.hasMatchingTag('Action', 'Airdrop'), function(msg)
    --  If account is not on the Balances list, then send an airdrop
    if not Balances[msg.From] then
        local airdropAmount = utils.toBalanceValue(multiplyByPower(1000))
        Balances[ao.id] = utils.subtract(Balances[ao.id], airdropAmount)
        Balances[msg.From] = airdropAmount
        print(msg.From .. " " .. "Your Game Balance is now " .. Balances[msg.From] .. " " .. Ticker)
        ao.send({
            Target = msg.From,
            Error = false,
            Amount = airdropAmount,
            Ticker = Ticker,
            Account = msg.From,
            Data = "You received an airdrop"
        })
    else
        print(msg.From .. " " .. "Airdrop Request Invalid")
        sendErrorMessage(msg, "Airdrop Request Invalid")
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
        sendErrorMessage(msg, 'Invalid token received', msg.Tags.Sender)
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
        sendErrorMessage(msg, 'Account has no balance')
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
        sendErrorMessage(msg, 'Account has no balance')
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
    local _randomValue = math.random() * 100
    print("_randomValue: " .. tostring(_randomValue))
    -- Convert the number to a string and find the decimal point
    local truncatedStr = string.match(string.format("%.12f", _randomValue), "%d+%.%d%d")
    local randomValue = tonumber(truncatedStr)

    local SLOPE = tonumber(-0.96)
    local INTERCEPT = tonumber(98)
    local _winChance = math.floor(SLOPE * sliderNum + INTERCEPT)
    print("_winChance: " .. _winChance)
    local _rollOver = 100 - _winChance
    print("_rollOver: " .. _rollOver)

    -- Check if the random value is greater than the win chance
    local playerWon = randomValue > _rollOver
    print("Evaluate: " .. randomValue .. " > " .. _rollOver)
    print("playerWon: " .. tostring(playerWon))

    print("sliderNum: " .. sliderNum)
    -- local houseEdge = (100 - sliderNum) / 10000 -- 0.0099 or 0.99%
    local houseEdge = 0
    print("houseEdge: " .. houseEdge)
    local _multiplier = 1 / ((_winChance / 100) + houseEdge)
    print("_multiplier: " .. _multiplier)
    local _multiplierFormatted = string.format("%.3f", _multiplier)
    print("_multiplierFormatted: " .. _multiplierFormatted)
    local _multiplierSliced = _multiplierFormatted:sub(1, -2)
    local _multiplierFixed = utils.toNumber(_multiplierSliced)
    print("_multiplierFixed: " .. _multiplierFixed)

    local _profitOnWin = utils.toNumber(msg.Tags.Quantity) * (_multiplierFixed - 1)
    print("_profitOnWin: " .. _profitOnWin)
    local _profitOnWinFormatted = string.format("%.0f", _profitOnWin)
    print("_profitOnWinFormatted: " .. _profitOnWinFormatted)
    -- Calculate the scaling factor
    local scale = 1e10
    local _profitOnWinScaled = math.floor(_profitOnWinFormatted / scale)
    print("_profitOnWinScaled: " .. _profitOnWinScaled)
    local _profitOnWinFinal = string.format("%.0f", (_profitOnWinScaled * scale))
    print("_profitOnWinFinal: " .. _profitOnWinFinal)
    print("divideByPower(_profitOnWinFinal): " .. divideByPower(_profitOnWinFinal))

    if playerWon then
        print(msg.From .. " PLAYER WON")
        Flippers[ao.id] = utils.subtract(Flippers[ao.id], _profitOnWinFinal)
        Flippers[msg.From] = utils.add(Flippers[msg.From], _profitOnWinFinal)

        local _data = {
            Action = msg.Action,
            Quantity = msg.Quantity,
            From = msg.From,
            BlockHeight = msg["Block-Height"],
            Timestamp = msg["Timestamp"],
            WinChance = _winChance,
            RollOver = _rollOver,
            Multiplier = _multiplierFixed,
            OldRandomSeed = OldRandomSeed,
            RandomValue = randomValue,
            DiscardNum = discardNum,
            Slider = msg.Tags.Slider,
            ProfitOnWin = _profitOnWinFinal,
            ProfitOnWinPower = divideByPower(_profitOnWinFinal),
            PlayerWon = playerWon,
            UserBalance = Flippers[msg.From],
            GameBalance = Flippers[ao.id],
        }
        print(_data)

        ao.send({ Target = msg.From, Won = true, Data = json.encode(_data) })
    else
        print(msg.From .. " PLAYER LOST")
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Quantity)
        Flippers[ao.id] = utils.add(Flippers[ao.id], msg.Quantity)

        local _data = {
            Action = msg.Action,
            Quantity = msg.Quantity,
            From = msg.From,
            BlockHeight = msg["Block-Height"],
            Timestamp = msg["Timestamp"],
            WinChance = _winChance,
            RollOver = _rollOver,
            Multiplier = _multiplierFixed,
            OldRandomSeed = OldRandomSeed,
            RandomValue = randomValue,
            DiscardNum = discardNum,
            Slider = msg.Tags.Slider,
            ProfitOnWin = _profitOnWinFinal,
            ProfitOnWinPower = divideByPower(_profitOnWinFinal),
            PlayerWon = playerWon,
            UserBalance = Flippers[msg.From],
            GameBalance = Flippers[ao.id],
        }
        print(_data)

        ao.send({ Target = msg.From, Won = false, Data = json.encode(_data) })
    end

    print("--------------- End FlipBet ---------------")
end)
