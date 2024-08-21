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

local sendErrorMessage = function(msg, err, target)
    if not target then
        ao.send({ Target = msg.From, Error = true, Data = err })
    else
        ao.send({ Target = target, Error = true, Data = err })
    end
end

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
        -- ao.send({
        --     Target = msg.Tags.Sender,
        --     Data = "Invalid token received",
        -- })
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
        sendErrorMessage(msg, 'Account does not exist')
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

Handlers.add('buy.long', Handlers.utils.hasMatchingTag('Action', 'BuyLong'), function(msg)
    print("buy.long: " .. msg.Tags.Quantity)
end)

Handlers.add('sell.short', Handlers.utils.hasMatchingTag('Action', 'SellShort'), function(msg)
    print("sell.short: " .. msg.Tags.Quantity)
end)
