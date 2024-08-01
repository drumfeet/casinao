local bint = require('.bint')(256)

Handlers.add('flip', Handlers.utils.hasMatchingTag('Action', 'Flip'), function(msg)
    assert(type(msg.Tags.Host) == 'string', 'Host is required!')
    local host = msg.Tags.Host
    local quantity = Stakers[host].amount
    -- assert(bint.__lt(0, bint(quantity)), 'Quantity must be greater than 0')
    assert(bint(0) < bint(quantity), 'Quantity must be greater than zero!')
end)
