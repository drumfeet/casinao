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
Balances = Balances or {}
PointsAO = PointsAO or {}
BASE_UNIT = BASE_UNIT or 10
Denomination = Denomination or 12
Ticker = Ticker or 'USD'

local printData = function(k, v)
    local _data = {
        Key = k,
        Value = v
    }
    print(_data)
end

local multiplyByPower = function(v)
    local value = v * (BASE_UNIT ^ Denomination)
    local strValue = string.format("%.0f", value)
    local result = utils.toNumber(strValue)
    return result
end

local divideByPower = function(v)
    local value = v / (BASE_UNIT ^ Denomination)
    local strValue = string.format("%.0f", value)
    local result = utils.toNumber(strValue)
    return result
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

InitialPrice = utils.toBalanceValue(multiplyByPower(1))
FundingRate = 0.05
Leverage = 1
MarkPrices = MarkPrices or { InitialPrice }
LongOrders = LongOrders or {}
ShortOrders = ShortOrders or {}
TotalLongPosition = TotalLongPosition or "0"
TotalShortPosition = TotalShortPosition or "0"

Handlers.add('long.orders', Handlers.utils.hasMatchingTag('Action', 'LongOrders'),
    function(msg)
        ao.send({ Target = msg.From, Data = json.encode(LongOrders) })
    end)

Handlers.add('short.orders', Handlers.utils.hasMatchingTag('Action', 'ShortOrders'),
    function(msg)
        ao.send({ Target = msg.From, Data = json.encode(ShortOrders) })
    end)

Handlers.add('long.order', Handlers.utils.hasMatchingTag('Action', 'LongOrder'), function(msg)
    local bal = '0'

    -- If not Recipient is provided, then return the Senders balance
    if (msg.Tags.Recipient) then
        if (LongOrders[msg.Tags.Recipient]) then
            bal = LongOrders[msg.Tags.Recipient]
        end
    elseif msg.Tags.Target and LongOrders[msg.Tags.Target] then
        bal = LongOrders[msg.Tags.Target]
    elseif LongOrders[msg.From] then
        bal = LongOrders[msg.From]
    end

    ao.send({
        Target = msg.From,
        Balance = bal,
        Ticker = Ticker,
        Account = msg.Tags.Recipient or msg.From,
        Data = bal
    })
end)

Handlers.add('short.order', Handlers.utils.hasMatchingTag('Action', 'ShortOrder'), function(msg)
    local bal = '0'

    -- If not Recipient is provided, then return the Senders balance
    if (msg.Tags.Recipient) then
        if (ShortOrders[msg.Tags.Recipient]) then
            bal = ShortOrders[msg.Tags.Recipient]
        end
    elseif msg.Tags.Target and ShortOrders[msg.Tags.Target] then
        bal = ShortOrders[msg.Tags.Target]
    elseif ShortOrders[msg.From] then
        bal = ShortOrders[msg.From]
    end

    ao.send({
        Target = msg.From,
        Balance = bal,
        Ticker = Ticker,
        Account = msg.Tags.Recipient or msg.From,
        Data = bal
    })
end)

Handlers.add('market.price', Handlers.utils.hasMatchingTag('Action', 'MarketPrice'), function(msg)
    local currentMarketPrice = MarkPrices[#MarkPrices]
    ao.send({
        Target = msg.From,
        Data = currentMarketPrice
    })
end)

Handlers.add('total.long.position', Handlers.utils.hasMatchingTag('Action', 'TotalLongPosition'), function(msg)
    ao.send({
        Target = msg.From,
        Data = TotalLongPosition
    })
end)

Handlers.add('total.short.position', Handlers.utils.hasMatchingTag('Action', 'TotalShortPosition'), function(msg)
    ao.send({
        Target = msg.From,
        Data = TotalShortPosition
    })
end)

Handlers.add('place.long', Handlers.utils.hasMatchingTag('Action', 'PlaceLong'), function(msg)
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

    -- Ensure that MarkPrices has at least one price
    if #MarkPrices == 0 then
        sendErrorMessage(msg, 'No market price available')
        return
    end

    -- Get the most recent market price
    local currentMarketPrice = utils.toNumber(MarkPrices[#MarkPrices])
    printData("currentMarketPrice", currentMarketPrice)
    local newOrderNum = utils.toNumber(msg.Tags.Quantity)
    printData("newOrderNum", newOrderNum)

    -- Handle opposite short orders if any
    local shortOrder = ShortOrders[msg.From] or "0"
    local shortOrderNum = utils.toNumber(shortOrder)
    printData("shortOrderNum", shortOrderNum)

    if shortOrderNum > 0 then
        -- Fetch the most recent market price after handling the opposite order
        currentMarketPrice = utils.toNumber(MarkPrices[#MarkPrices])

        -- Calculate the price adjustment due to the opposite order being closed
        local priceImpactFactor = 0.01 -- Adjust this factor based on your desired sensitivity
        local adjustedMarketPrice = currentMarketPrice *
            (1 - (priceImpactFactor * shortOrderNum / (utils.toNumber(TotalLongPosition) or 1)))

        -- Update the market price before executing the remaining order
        table.insert(MarkPrices, tostring(adjustedMarketPrice))
        if #MarkPrices > 1440 then -- Maintain a fixed size of MarkPrices history, if desired
            table.remove(MarkPrices, 1)
        end

        -- Apply the adjusted market price
        currentMarketPrice = adjustedMarketPrice

        if shortOrderNum >= newOrderNum then
            ShortOrders[msg.From] = utils.subtract(shortOrder, msg.Tags.Quantity)
            Balances[msg.From] = utils.add(Balances[msg.From], tostring(newOrderNum * currentMarketPrice))   -- Refund the full amount based on the market price
            if utils.toNumber(ShortOrders[msg.From]) == 0 then
                ShortOrders[msg.From] = nil                                                                  -- Clear the short order if it's fully reduced
            end
            return                                                                                           -- Exit since the opposite order has been handled
        else
            Balances[msg.From] = utils.add(Balances[msg.From], tostring(shortOrderNum * currentMarketPrice)) -- Refund the amount equal to the short order based on market price
            ShortOrders[msg.From] = nil                                                                      -- Clear the short order
            newOrderNum = newOrderNum -
                shortOrderNum                                                                                -- Continue with the remaining long order amount
        end
    end

    -- Fetch the most recent market price again after handling the opposite order
    currentMarketPrice = utils.toNumber(MarkPrices[#MarkPrices])
    printData("currentMarketPrice", currentMarketPrice)

    -- Execute the market order at the latest price
    local currentHolding = LongOrders[msg.From] or "0"
    printData("currentHolding", currentHolding)
    local newOrderSizeNum = newOrderNum * divideByPower(currentMarketPrice)
    printData("newOrderSizeNum", newOrderSizeNum)

    Balances[msg.From] = utils.subtract(Balances[msg.From], msg.Tags.Quantity) -- Subtract the USD amount from the account balances
    LongOrders[msg.From] = utils.add(currentHolding, newOrderSizeNum)          -- Add to the user's long position
    printData("LongOrders[msg.From]", LongOrders[msg.From])

    -- Update the total long position
    TotalLongPosition = utils.add(TotalLongPosition, newOrderSizeNum)

    -- Adjust the market price based on the total position size
    local priceImpactFactor = 0.01 -- Adjust this factor based on your desired sensitivity
    local newMarketPrice = currentMarketPrice *
        (1 + (priceImpactFactor * newOrderNum / utils.toNumber(TotalLongPosition)))
    printData("newMarketPrice", newMarketPrice)
    local newMarketPriceStr = string.format("%.0f", newMarketPrice)
    printData("newMarketPriceStr", newMarketPriceStr)

    -- Update the MarkPrices table with the new market price
    table.insert(MarkPrices, newMarketPriceStr)
    if #MarkPrices > 1440 then -- Maintain a fixed size of MarkPrices history, if desired
        table.remove(MarkPrices, 1)
    end
end)
