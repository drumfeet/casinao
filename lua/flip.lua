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

TOKEN_PROCESS_ID = "ki0uYcueccVW5AjpfdcJqS5yHVtiVTXz855dbnzwWBI"
BASE_UNIT = BASE_UNIT or 10
Denomination = Denomination or 12
Flippers = Flippers or {}
Ticker = Ticker or 'FLIP'
OldRandomSeed = OldRandomSeed or 1984

local multiplyByPower = function(v)
    return v * (BASE_UNIT ^ Denomination)
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

    if bint(msg.Quantity) <= 0 then
        sendErrorMessage(msg, 'Quantity must be greater than 0')
        return
    end

    if not Flippers[msg.From] then
        sendErrorMessage(msg, 'Account does not exist')
        return
    end

    if bint(Flippers[msg.From]) < bint(msg.Quantity) then
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
