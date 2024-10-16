local bint = require('.bint')(256)
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
    removeDecimals = function(a)
        local str = tostring(a)
        local decimalPosition = str:find("%.")
        local result
        if decimalPosition then
            result = bint.tonumber(str:sub(1, decimalPosition - 1))
        else
            result = bint.tonumber(str)
        end
        if result == nil then
            error("Invalid number format: " .. str)
        end
        return result
    end
}

TOKEN_PROCESS_ID = "XIJzo8ooZVGIsxFVhQDYW0ziJBX7Loh9Pi280ro2YU4"
Balances = Balances or {}
BASE_UNIT = BASE_UNIT or 10
Denomination = Denomination or 12
Ticker = Ticker or 'FLIP'
OldRandomSeed = OldRandomSeed or 1984

local printData = function(k, v)
    local _data = {
        Key = k,
        Value = v
    }
    print(_data)
end

local multiplyByPower = function(v)
    return v * (BASE_UNIT ^ Denomination)
end

local divideByPower = function(v)
    return v / (BASE_UNIT ^ Denomination)
end

local sendErrorMessage = function(msg, err, target)
    if not target then
        ao.send({ Target = msg.From, Error = true, Data = err })
        printData("Error", "Target" .. " " .. msg.From .. " " .. err)
    else
        ao.send({ Target = target, Error = true, Data = err })
        printData("Error", "Target" .. " " .. target .. " " .. err)
    end
end

Handlers.add('airdrop', Handlers.utils.hasMatchingTag('Action', 'Airdrop'), function(msg)
    --  If account is not on the Balances list, then send an airdrop
    if not Balances[msg.From] then
        local airdropAmount = utils.toBalanceValue(multiplyByPower(1000))
        Balances[ao.id] = utils.subtract(Balances[ao.id], airdropAmount)
        Balances[msg.From] = airdropAmount
        printData("Airdrop", msg.From .. " " .. "You received an airdrop")
        ao.send({
            Target = msg.From,
            Error = false,
            Amount = airdropAmount,
            Ticker = Ticker,
            Account = msg.From,
            Data = "You received an airdrop"
        })
    else
        sendErrorMessage(msg, "Airdrop Request Invalid")
    end
end)

Handlers.add('balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(msg)
    local bal = '0'

    -- If not Recipient is provided, then return the Senders balance
    if (msg.Tags.Recipient) then
        if (Balances[msg.Tags.Recipient]) then
            bal = Balances[msg.Tags.Recipient]
        end
    elseif msg.Tags.Target and Balances[msg.Tags.Target] then
        bal = Balances[msg.Tags.Target]
    elseif Balances[msg.From] then
        bal = Balances[msg.From]
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
        ao.send({ Target = msg.From, Data = json.encode(Balances) })
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
            local currentVal = Balances[ao.id] or "0"
            Balances[ao.id] = utils.add(currentVal, msg.Tags.Quantity)
            printOutput(Balances[ao.id])
        else
            local currentVal = Balances[msg.Tags.Sender] or "0"
            Balances[msg.Tags.Sender] = utils.add(currentVal, msg.Tags.Quantity)
            printOutput(Balances[msg.Tags.Sender])
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
    if type(msg.Tags.Quantity) ~= 'string' then
        sendErrorMessage(msg, 'Quantity is required and must be a string')
        return
    end

    if utils.toNumber(msg.Tags.Quantity) <= 0 then
        sendErrorMessage(msg, 'Quantity must be greater than 0')
        return
    end

    if not Balances[msg.From] then
        sendErrorMessage(msg, 'Account has no balance')
        return
    end

    if utils.toNumber(Balances[msg.From]) < utils.toNumber(msg.Tags.Quantity) then
        sendErrorMessage(msg, 'Insufficient funds')
        return
    end

    ao.send({
        Target = TOKEN_PROCESS_ID,
        Action = "Transfer",
        Recipient = msg.From,
        Quantity = msg.Tags.Quantity,
    })
    Balances[msg.From] = utils.subtract(Balances[msg.From], msg.Tags.Quantity)
end)

local redNumbers = { 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36 }
local blackNumbers = { 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35 }
local column1Numbers = { 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 }
local column2Numbers = { 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 }
local column3Numbers = { 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 }
local isNumberInList = function(number, list)
    for _, num in ipairs(list) do
        if num == number then
            return true
        end
    end
    return false
end

Handlers.add('roulette', Handlers.utils.hasMatchingTag('Action', 'Roulette'), function(msg)
    print("--------------- Start Roulette ---------------")

    if type(msg.Tags.Quantity) ~= 'string' then
        sendErrorMessage(msg, 'Quantity is required and must be a string')
        return
    end

    if utils.toNumber(msg.Tags.Quantity) <= 0 then
        sendErrorMessage(msg, 'Quantity must be greater than 0')
        return
    end

    if not Balances[msg.From] then
        sendErrorMessage(msg, 'Account has no balance')
        return
    end

    if utils.toNumber(Balances[msg.From]) < utils.toNumber(msg.Tags.Quantity) then
        sendErrorMessage(msg, 'Insufficient funds')
        return
    end

    if type(msg.Tags.Bets) ~= 'string' then
        sendErrorMessage(msg, 'Bets is required and must be a json string')
        return
    end

    local bets = json.decode(msg.Tags.Bets)
    if not bets or type(bets) ~= 'table' then
        sendErrorMessage(msg, 'Invalid bets format')
        return
    end

    -- Calculate the total bet amount
    local totalBetAmount = 0
    for _, betAmount in pairs(bets) do
        totalBetAmount = totalBetAmount + multiplyByPower(betAmount)
    end

    if totalBetAmount ~= utils.toNumber(msg.Tags.Quantity) then
        sendErrorMessage(msg, 'Total bet amount does not match quantity')
        return
    end

    local success, err = pcall(function()
        -- Deduct the total bet amount from the user's balance
        Balances[msg.From] = utils.subtract(Balances[msg.From], msg.Tags.Quantity)
        printData("Balances[msg.From]", Balances[msg.From])
        Balances[ao.id] = utils.add(Balances[ao.id], msg.Tags.Quantity)
        printData("Balances[ao.id]", Balances[ao.id])

        -- Generate multiple random factors for added entropy
        local randomFactor1 = math.random()
        local randomFactor2 = math.random()
        local randomFactor3 = math.random()
        local randomFactor4 = math.random()
        local blockHeightNum = utils.toNumber(msg["Block-Height"])
        local mixing = ((blockHeightNum * randomFactor1) / (OldRandomSeed + randomFactor2) * randomFactor3) +
            randomFactor4
        local seed = math.floor(mixing * 2 ^ 32) % 2 ^ 32
        -- Seed the random number generator with the non-deterministic seed
        math.randomseed(seed)
        OldRandomSeed = seed

        local combined = tostring(msg["Timestamp"]) .. tostring(math.floor(OldRandomSeed))
        printData("combined", combined)
        local length = string.len(combined)
        printData("length", length)
        -- Generate a random index
        local randomIndex = math.random(1, length)
        printData("randomIndex", randomIndex)
        -- Pick the digit at the random index
        local discardNum = tonumber(combined:sub(randomIndex, randomIndex))
        printData("discardNum", discardNum)
        -- Discard the first few values to avoid issues with some RNGs' initial values
        for i = 1, discardNum do
            math.random()
        end

        local winningNumber = math.random(0, 36)
        printData("winningNumber", winningNumber)

        local payout = 0

        -- Process individual number bets
        if bets[tostring(winningNumber)] then
            payout = payout + bets[tostring(winningNumber)] * 36 -- Payout for a single number bet is 35:1
        end

        -- Process color bets (Red/Black)
        if bets["red"] and isNumberInList(winningNumber, redNumbers) then
            payout = payout + bets["red"] * 2   -- Payout for red bet is 1:1
        elseif bets["black"] and isNumberInList(winningNumber, blackNumbers) then
            payout = payout + bets["black"] * 2 -- Payout for black bet is 1:1
        end

        -- Process even/odd bets
        if bets["even"] and winningNumber > 0 and winningNumber % 2 == 0 then
            payout = payout + bets["even"] * 2 -- Payout for even bet is 1:1
        elseif bets["odd"] and winningNumber > 0 and winningNumber % 2 ~= 0 then
            payout = payout + bets["odd"] * 2  -- Payout for odd bet is 1:1
        end

        -- Process low/high bets (1-18 and 19-36)
        if bets["1to18"] and winningNumber >= 1 and winningNumber <= 18 then
            payout = payout + bets["1to18"] * 2  -- Payout for low bet is 1:1
        elseif bets["19to36"] and winningNumber >= 19 and winningNumber <= 36 then
            payout = payout + bets["19to36"] * 2 -- Payout for high bet is 1:1
        end

        -- Process dozen bets (1 to 12, 13 to 24, 25 to 36)
        if bets["1to12"] and winningNumber >= 1 and winningNumber <= 12 then
            payout = payout + bets["1to12"] * 3  -- Payout for dozen bet is 2:1
        elseif bets["13to24"] and winningNumber >= 13 and winningNumber <= 24 then
            payout = payout + bets["13to24"] * 3 -- Payout for dozen bet is 2:1
        elseif bets["25to36"] and winningNumber >= 25 and winningNumber <= 36 then
            payout = payout + bets["25to36"] * 3 -- Payout for dozen bet is 2:1
        end

        -- Process 2:1 column bets
        if bets["2:1_1"] and isNumberInList(winningNumber, column1Numbers) then
            payout = payout + bets["2:1_1"] * 3 -- Payout for column bet is 2:1
        elseif bets["2:1_2"] and isNumberInList(winningNumber, column2Numbers) then
            payout = payout + bets["2:1_2"] * 3 -- Payout for column bet is 2:1
        elseif bets["2:1_3"] and isNumberInList(winningNumber, column3Numbers) then
            payout = payout + bets["2:1_3"] * 3 -- Payout for column bet is 2:1
        end

        local totalPayout = utils.toBalanceValue(multiplyByPower(payout))
        printData("totalPayout", "multiplyByPower(payout)" .. totalPayout)

        -- Total payout to the player
        if utils.toNumber(totalPayout) > 0 then
            Balances[ao.id] = utils.subtract(Balances[ao.id], totalPayout)
            Balances[msg.From] = utils.add(Balances[msg.From], totalPayout)
        end

        local _data = {
            Action = msg.Action,
            Quantity = msg.Tags.Quantity,
            From = msg.From,
            BlockHeight = msg["Block-Height"],
            Timestamp = msg["Timestamp"],
            OldRandomSeed = OldRandomSeed,
            WinningNumber = winningNumber,
            DiscardNum = discardNum,
            UserBalance = Balances[msg.From],
            GameBalance = Balances[ao.id],
            Payout = "divideByPower(totalPayout): " .. divideByPower(totalPayout),
            PayoutNum = utils.toNumber(divideByPower(totalPayout)),
            Bets = bets,
        }
        printData("_data", _data)

        ao.send({
            Target = msg.From,
            Data = json.encode(_data),
        })
    end)

    -- Error handling: if something went wrong, revert the balance and notify the user
    if not success then
        -- Revert the balance change
        Balances[msg.From] = utils.add(Balances[msg.From], msg.Tags.Quantity)
        Balances[ao.id] = utils.subtract(Balances[ao.id], msg.Tags.Quantity)

        -- Send an error message back to the user
        sendErrorMessage(msg, 'An unexpected error occurred: ' .. tostring(err))
    end

    print("--------------- End Roulette ---------------")
end)

Handlers.add('dice', Handlers.utils.hasMatchingTag('Action', 'Dice'), function(msg)
    print("Received message: " .. json.encode(msg))

    print("--------------- Start Dice ---------------")

    if type(msg.Tags.Quantity) ~= 'string' then
        sendErrorMessage(msg, 'Quantity is required and must be a string')
        return
    end

    if utils.toNumber(msg.Tags.Quantity) <= 0 then
        sendErrorMessage(msg, 'Quantity must be greater than 0')
        return
    end

    if not Balances[msg.From] then
        sendErrorMessage(msg, 'Account has no balance')
        return
    end

    if utils.toNumber(Balances[msg.From]) < utils.toNumber(msg.Tags.Quantity) then
        sendErrorMessage(msg, 'Insufficient funds')
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

    local success, err = pcall(function()
        -- Deduct the total bet amount from the user's balance
        Balances[msg.From] = utils.subtract(Balances[msg.From], msg.Tags.Quantity)
        printData("Balances[msg.From]", Balances[msg.From])
        Balances[ao.id] = utils.add(Balances[ao.id], msg.Tags.Quantity)
        printData("Balances[ao.id]", Balances[ao.id])

        -- Generate multiple random factors for added entropy
        local randomFactor1 = math.random()
        local randomFactor2 = math.random()
        local randomFactor3 = math.random()
        local randomFactor4 = math.random()
        local blockHeightNum = utils.toNumber(msg["Block-Height"])
        local mixing = ((blockHeightNum * randomFactor1) / (OldRandomSeed + randomFactor2) * randomFactor3) +
            randomFactor4
        local seed = math.floor(mixing * 2 ^ 32) % 2 ^ 32
        -- Seed the random number generator with the non-deterministic seed
        math.randomseed(seed)
        OldRandomSeed = seed

        local combined = tostring(msg["Timestamp"]) .. tostring(math.floor(OldRandomSeed))
        printData("combined", combined)
        local length = string.len(combined)
        printData("length", length)
        -- Generate a random index
        local randomIndex = math.random(1, length)
        printData("randomIndex", randomIndex)
        -- Pick the digit at the random index
        local discardNum = tonumber(combined:sub(randomIndex, randomIndex))
        printData("discardNum", discardNum)
        -- Discard the first few values to avoid issues with some RNGs' initial values
        for i = 1, discardNum do
            math.random()
        end
        -- Generate a random number to determine win or loss
        local winningNumber = math.random(0, 100)
        printData("winningNumber", winningNumber)

        local SLOPE = tonumber(-0.96)  -- This slope controls the rate of change in win chance
        local INTERCEPT = tonumber(98) -- This intercept ensures win chance starts at 98%
        local _winChance = math.floor(SLOPE * sliderNum + INTERCEPT)
        print("_winChance: " .. _winChance)
        local _rollOver = 100 - _winChance
        print("_rollOver: " .. _rollOver)

        -- Check if the random value is greater than the win chance
        local playerWon = winningNumber > _rollOver
        print("Evaluate: " .. winningNumber .. " > " .. _rollOver)
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

        local totalPayout = "0"
        if playerWon then
            -- The total amount to add back is the original bet + profit
            totalPayout = utils.add(msg.Tags.Quantity, _profitOnWinFormatted)
            Balances[ao.id] = utils.subtract(Balances[ao.id], totalPayout)
            Balances[msg.From] = utils.add(Balances[msg.From], totalPayout)
        end

        local _data = {
            Action = msg.Action,
            Quantity = msg.Tags.Quantity,
            From = msg.From,
            BlockHeight = msg["Block-Height"],
            Timestamp = msg["Timestamp"],
            OldRandomSeed = OldRandomSeed,
            WinningNumber = winningNumber,
            DiscardNum = discardNum,
            WinChance = _winChance,
            RollOver = _rollOver,
            Multiplier = _multiplierFixed,
            Slider = msg.Tags.Slider,
            ProfitOnWin = "divideByPower(_profitOnWinFinal): " .. divideByPower(_profitOnWinFinal),
            PlayerWon = playerWon,
            UserBalance = Balances[msg.From],
            GameBalance = Balances[ao.id],
            Payout = "divideByPower(totalPayout): " .. divideByPower(totalPayout),
        }
        print(_data)
        ao.send({ Target = msg.From, Won = playerWon,
        Wonn = playerWon, Wonnn = playerWon, --workaround for aos 2.0
        Data = json.encode(_data) })
    end)

    -- Error handling: if something went wrong, revert the balance and notify the user
    if not success then
        -- Revert the balance change
        Balances[msg.From] = utils.add(Balances[msg.From], msg.Tags.Quantity)
        Balances[ao.id] = utils.subtract(Balances[ao.id], msg.Tags.Quantity)

        -- Send an error message back to the user
        sendErrorMessage(msg, 'An unexpected error occurred: ' .. tostring(err))
    end

    print("--------------- End Dice ---------------")
end)
