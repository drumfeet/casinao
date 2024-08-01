local bint = require('.bint')(256)
OldRandomSeed = OldRandomSeed or 69420

--[[
  utils helper functions to remove the bint complexity.
]]
--


local utils = {
    add = function(a, b)
        return tostring(bint(a) + bint(b))
    end,
    subtract = function(a, b)
        return tostring(bint(a) - bint(b))
    end,
    modulo = function(a)
        return tostring(bint(a) % bint(2))
    end
}

Handlers.add('flip', Handlers.utils.hasMatchingTag('Action', 'Flip'), function(msg)
    assert(type(msg.Tags.Host) == 'string', 'Host is required!')
    local host = msg.Tags.Host
    local quantity = bint(Stakers[host].amount)
    -- assert(bint.__lt(0, bint(quantity)), 'Quantity must be greater than 0')
    assert(bint(0) < bint(quantity), 'Quantity must be greater than zero!')

    Stakers[msg.From] = Stakers[msg.From] or { amount = "0" }
    assert(Stakers[msg.From] and bint(Stakers[msg.From].amount) == bint(quantity), "Insufficient staked amount")

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
        -- Host won
        Stakers[msg.From].amount = utils.subtract(Stakers[host].amount, quantity)
        Stakers[host].amount = utils.add(Stakers[msg.From].amount, quantity)
        print(msg.From .. " LOST")
        ao.send({ Target = msg.From, Won = false, Data = "You Lose!" })
    else
        -- Flipper won
        Stakers[host].amount = utils.subtract(Stakers[host].amount, quantity)
        Stakers[msg.From].amount = utils.add(Stakers[msg.From].amount, quantity)
        print(msg.From .. " WON")
        ao.send({ Target = msg.From, Won = true, Data = "You Won!" })
    end
end)
