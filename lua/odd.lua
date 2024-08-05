local bint = require('.bint')(256)
local ao = require('ao')

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
    modulo = function(a)
        return tostring(bint(a) % bint(2))
    end
}

WAR_PROCESS_ID = "_JZTfLS-ssyKKNn-qMb7PSifdo_1SZ14UlI_RRg-nfo" -- xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10
OldRandomSeed = OldRandomSeed or 19840
Denomination = Denomination or 0
Flippers = Flippers or
    { [ao.id] = utils.toBalanceValue(146 * 10 ^ Denomination) } -- TODO: fetch current wAR token balance
Ticker = Ticker or 'FLIP'

Handlers.add('Credit-Notice', Handlers.utils.hasMatchingTag('Action', 'Credit-Notice'), function(msg)
    OldRandomSeed = tonumber(msg["Block-Height"])

    print("Credit-Notice: " .. msg.Tags.Quantity)
    print("msg.From: " .. msg.From)
    print("msg.Tags.Sender: " .. msg.Tags.Sender)
    print("msg[Block-Height]: " .. msg["Block-Height"])
    print("msg[Timestamp]: " .. msg["Timestamp"])
    if msg.From == WAR_PROCESS_ID then
        Flippers[msg.Tags.Sender] = utils.add(Flippers[msg.Tags.Sender] or "0", msg.Tags.Quantity)
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

    -- validate wAR token process id and quantity
end)

Handlers.add('flip.odd', Handlers.utils.hasMatchingTag('Action', 'FlipOdd'), function(msg)
    assert(type(msg.Tags.Quantity) == 'string', 'Quantity is required!')
    assert(bint(0) < bint(msg.Tags.Quantity), 'Quantity must be greater than zero!')

    OldRandomSeed = tonumber(msg["Block-Height"])

    -- Calculate a mixing value using block height, timestamp, and random factors
    local blockHeight = tonumber(msg["Block-Height"])
    local timestamp = tonumber(msg["Timestamp"])
    local randomFactor1 = math.random()
    local randomFactor2 = math.random()
    local randomFactor3 = math.random()
    local randomFactor4 = math.random()
    local mixing = ((blockHeight * randomFactor1 + timestamp * randomFactor2) / (OldRandomSeed + randomFactor3) * randomFactor4)
    local seed = math.floor(mixing * 2 ^ 32) % 2 ^ 32
    math.randomseed(seed)
    OldRandomSeed = seed
    local _result = utils.modulo(OldRandomSeed)

    if (tonumber(_result) == 1) then
        -- Flipper won
        print(msg.From .. " PLAYER WON")
        Flippers[ao.id] = utils.subtract(Flippers[ao.id], msg.Tags.Quantity)
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Tags.Quantity)
        ao.send({ Target = msg.From, Won = true, Data = "You Won!" })

        local totalAmount = utils.add(msg.Tags.Quantity, msg.Tags.Quantity)
        ao.send({
            Target = WAR_PROCESS_ID,
            Action = "Transfer",
            Recipient = msg.From,
            Quantity = totalAmount,
        })
    else
        -- Game Host won
        print(msg.From .. " PLAYER LOST")
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Tags.Quantity)
        Flippers[ao.id] = utils.add(Flippers[ao.id], msg.Tags.Quantity)
        ao.send({ Target = msg.From, Won = false, Data = "You Lose!" })
    end
end)

Handlers.add('flip.even', Handlers.utils.hasMatchingTag('Action', 'FlipEven'), function(msg)
    assert(type(msg.Tags.Quantity) == 'string', 'Quantity is required!')
    assert(bint(0) < bint(msg.Tags.Quantity), 'Quantity must be greater than zero!')

    OldRandomSeed = tonumber(msg["Block-Height"])

    -- Calculate a mixing value using block height, timestamp, and random factors
    local blockHeight = tonumber(msg["Block-Height"])
    local timestamp = tonumber(msg["Timestamp"])
    local randomFactor1 = math.random()
    local randomFactor2 = math.random()
    local randomFactor3 = math.random()
    local randomFactor4 = math.random()
    local mixing = ((blockHeight * randomFactor1 + timestamp * randomFactor2) / (OldRandomSeed + randomFactor3) * randomFactor4)
    local seed = math.floor(mixing * 2 ^ 32) % 2 ^ 32
    math.randomseed(seed)
    OldRandomSeed = seed
    local _result = utils.modulo(OldRandomSeed)

    if (tonumber(_result) == 1) then
        -- Game Host won
        print(msg.From .. " PLAYER LOST")
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Tags.Quantity)
        Flippers[ao.id] = utils.add(Flippers[ao.id], msg.Tags.Quantity)
        ao.send({ Target = msg.From, Won = false, Data = "You Lose!" })
    else
        -- Flipper won
        print(msg.From .. " PLAYER WON")
        Flippers[ao.id] = utils.subtract(Flippers[ao.id], msg.Tags.Quantity)
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Tags.Quantity)
        ao.send({ Target = msg.From, Won = true, Data = "You Won!" })

        local totalAmount = utils.add(msg.Tags.Quantity, msg.Tags.Quantity)
        ao.send({
            Target = WAR_PROCESS_ID,
            Action = "Transfer",
            Recipient = msg.From,
            Quantity = totalAmount,
        })
    end
end)

Handlers.add('balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(msg)
    local bal = '0'

    -- -- If not Recipient is provided, then return the Senders balance
    if (msg.Tags.Recipient) then
        if (Flippers[msg.Tags.Recipient]) then
            bal = Flippers[msg.Tags.Recipient]
            print("Balance one: " .. bal)
        end
    elseif msg.Tags.Target and Flippers[msg.Tags.Target] then
        bal = Flippers[msg.Tags.Target]
        print("Balance two: " .. bal)
    elseif Flippers[msg.From] then
        bal = Flippers[msg.From]
        print("Balance three: " .. bal)
    end

    ao.send({
        Target = msg.From,
        Balance = bal,
        Ticker = Ticker,
        Account = msg.Tags.Recipient or msg.From,
        Data = tostring(bal) -- Convert the balance to a string; otherwise, ao.send() will not function correctly.
    })
end)

Handlers.add('withdraw', Handlers.utils.hasMatchingTag('Action', 'Withdraw'), function(msg)
    assert(type(msg.Quantity) == 'string', 'Quantity is required!')
    assert(bint.__lt(0, bint(msg.Quantity)), 'Quantity must be greater than 0')

    if not Flippers[msg.From] then Flippers[msg.From] = "0" end

    if bint(msg.Quantity) <= bint(Flippers[msg.From]) then
        ao.send({
            Target = WAR_PROCESS_ID,
            Action = "Transfer",
            Recipient = msg.From,
            Quantity = msg.Quantity,
        })
        Flippers[msg.From] = utils.subtract(Flippers[msg.From], msg.Quantity)
    else
        ao.send({
            Target = msg.From,
            Action = 'Transfer-Error',
            ['Message-Id'] = msg.Id,
            Error = 'Insufficient Balance!'
        })
    end
end)
