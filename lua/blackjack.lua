GameStates = GameStates or {}

-- Function to calculate hand value
local calculateHandValue = function(hand)
    local value, aces = 0, 0
    for _, card in ipairs(hand) do
        if card.rank == 'J' or card.rank == 'Q' or card.rank == 'K' or card.rank == '10' then
            value = value + 10
        elseif card.rank == 'A' then
            aces = aces + 1
            value = value + 11
        else
            value = value + tonumber(card.rank)
        end
    end

    -- Adjust for aces if the total is over 21
    while value > 21 and aces > 0 do
        value = value - 10
        aces = aces - 1
    end

    return value
end

-- Handler for initial deal
Handlers.add('deal', Handlers.utils.hasMatchingTag('Action', 'Deal'), function(msg)
    print("--------------- Start Deal ---------------")

    if GameStates[msg.From] then
        -- sendErrorMessage(msg, 'Finish your current active game')
        ao.send({
            Target = msg.From,
            Data = json.encode(GameStates[msg.From])
        })
        return
    end

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

    local potentialPayout = utils.toNumber(msg.Tags.Quantity) * 2
    if potentialPayout > utils.toNumber(Balances[ao.id]) then
        sendErrorMessage(msg, 'Insufficient funds for potential payout')
        return
    end

    local success, err = pcall(function()
        -- Deduct the total bet amount from the user's balance
        Balances[msg.From] = utils.subtract(Balances[msg.From], msg.Tags.Quantity)
        Balances[ao.id] = utils.add(Balances[ao.id], msg.Tags.Quantity)

        -- Create a deck of cards
        local suits = { 'Hearts', 'Diamonds', 'Clubs', 'Spades' }
        local ranks = { '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A' }

        local deck = {}
        for _, suit in ipairs(suits) do
            for _, rank in ipairs(ranks) do
                table.insert(deck, { rank = rank, suit = suit })
            end
        end

        -- Shuffle the deck
        local function shuffle(deck)
            math.randomseed(OldRandomSeed)
            for i = #deck, 2, -1 do
                local j = math.random(1, i)
                deck[i], deck[j] = deck[j], deck[i]
            end
        end

        shuffle(deck)

        -- Deal two cards to the player and one card to the dealer (the "up" card)
        local playerHand = { table.remove(deck), table.remove(deck) }
        local dealerHand = { table.remove(deck) } -- Only one card for now (dealer's up card)

        -- Calculate initial hand values
        local playerValue = calculateHandValue(playerHand)
        local dealerUpCardValue = calculateHandValue(dealerHand)

        -- Check if the dealer's up card is an Ace
        local dealerUpCardIsAce = dealerHand[1].rank == 'A'

        -- Check for player's natural Blackjack
        local playerHasBlackjack = (playerValue == 21 and #playerHand == 2)

        -- Store the initial game state
        local gameState = {
            PlayerHand = playerHand,
            DealerHand = dealerHand, -- Only the dealer's up card
            PlayerValue = playerValue,
            DealerUpCardValue = dealerUpCardValue,
            BetAmount = msg.Tags.Quantity,
            Action = 'Deal',
            InsuranceOption = dealerUpCardIsAce, -- Offer insurance only if the dealer shows an Ace
            PlayerHasBlackjack = playerHasBlackjack,
            Deck = deck,                         -- Save deck state to resume later
            GameInProgress = true
        }

        -- If the dealer's up card is an Ace, offer insurance
        if dealerUpCardIsAce then
            GameStates[msg.From] = gameState
            printData("gameState", gameState)
            -- Send insurance option to the player
            ao.send({
                Target = msg.From,
                Data = json.encode(gameState)
            })
            return
        end

        -- Check for Blackjack and resolve the game if necessary
        if playerHasBlackjack then
            table.insert(dealerHand, table.remove(deck))
            local dealerValue = calculateHandValue(dealerHand)
            local dealerHasBlackjack = (dealerValue == 21 and #dealerHand == 2)

            if dealerHasBlackjack then
                -- Push if both have Blackjack
                Balances[msg.From] = utils.add(Balances[msg.From], msg.Tags.Quantity)
                gameState.Result = 'Push'
            else
                -- Player wins with Blackjack
                local blackjackPayout = utils.toNumber(msg.Tags.Quantity) * 1.5
                Balances[msg.From] = utils.add(Balances[msg.From], blackjackPayout)
                Balances[ao.id] = utils.subtract(Balances[ao.id], blackjackPayout)
                gameState.Result = 'PlayerWinsBlackjack'
            end
            gameState.DealerHand = dealerHand
            gameState.DealerValue = dealerValue

            ao.send({
                Target = msg.From,
                Data = json.encode(gameState)
            })

            printData("gameState", gameState)
            GameStates[msg.From] = nil
            return
        end

        -- If no Blackjack, store the state and continue the game
        GameStates[msg.From] = gameState

        printData("gameState", gameState)
        -- Send the initial game state back to the player
        ao.send({
            Target = msg.From,
            Data = json.encode(gameState)
        })
    end)

    -- Error handling
    if not success then
        Balances[msg.From] = utils.add(Balances[msg.From], msg.Tags.Quantity)
        Balances[ao.id] = utils.subtract(Balances[ao.id], msg.Tags.Quantity)
        sendErrorMessage(msg, 'An unexpected error occurred: ' .. tostring(err))
    end

    print("--------------- End Deal ---------------")
end)

-- Handler for insurance decision
Handlers.add('insurance', Handlers.utils.hasMatchingTag('Action', 'Insurance'), function(msg)
    local gameState = GameStates[msg.From]
    if not gameState then
        sendErrorMessage(msg, "No active game found")
        return
    end

    -- Process insurance decision
    local insuranceAccepted = msg.Tags.InsuranceAccepted == 'true'

    -- Deduct insurance bet if taken (usually half the original bet)
    if insuranceAccepted then
        local insuranceBetNum = utils.toNumber(gameState.BetAmount) / 2
        Balances[msg.From] = utils.subtract(Balances[msg.From], insuranceBetNum)
        Balances[ao.id] = utils.add(Balances[ao.id], insuranceBetNum)
    end

    -- Check if the dealer has Blackjack
    local deck = gameState.Deck
    local dealerHand = gameState.DealerHand
    table.insert(dealerHand, table.remove(deck))

    local dealerValue = calculateHandValue(dealerHand)
    local dealerHasBlackjack = (dealerValue == 21 and #dealerHand == 2)

    if dealerHasBlackjack then
        if insuranceAccepted then
            -- Player wins the insurance bet but loses the main bet
            local insurancePayout = utils.toNumber(gameState.BetAmount)
            Balances[msg.From] = utils.add(Balances[msg.From], insurancePayout)
        end
        gameState.Result = 'DealerWinsBlackjack'
    else
        gameState.Result = 'GameContinues'
    end

    gameState.DealerHand = dealerHand
    gameState.DealerValue = dealerValue
    GameStates[msg.From] = gameState
    printData("gameState", gameState)

    -- Send the updated game state
    ao.send({
        Target = msg.From,
        Data = json.encode(gameState)
    })
end)

-- Handler for "hit" action
Handlers.add('hit', Handlers.utils.hasMatchingTag('Action', 'Hit'), function(msg)
    local gameState = GameStates[msg.From]
    if not gameState then
        sendErrorMessage(msg, "No active game found")
        return
    end

    local deck = gameState.Deck
    local playerHand = gameState.PlayerHand
    table.insert(playerHand, table.remove(deck))

    -- Calculate updated hand value
    local playerValue = calculateHandValue(playerHand)

    -- Check if the player busted
    if playerValue > 21 then
        gameState.Result = 'PlayerBust'
        GameStates[msg.From] = nil
    else
        gameState.PlayerValue = playerValue
        gameState.Result = 'GameContinues'
        GameStates[msg.From] = gameState
    end

    -- Send the updated game state
    ao.send({
        Target = msg.From,
        Data = json.encode(gameState)
    })
end)

-- Handler for "stand" action
Handlers.add('stand', Handlers.utils.hasMatchingTag('Action', 'Stand'), function(msg)
    local gameState = GameStates[msg.From]
    if not gameState then
        sendErrorMessage(msg, "No active game found")
        return
    end

    -- Play out the dealer's hand
    local deck = gameState.Deck
    local dealerHand = gameState.DealerHand

    -- Dealer must hit until they have at least 17
    local dealerValue = calculateHandValue(dealerHand)
    while dealerValue < 17 do
        table.insert(dealerHand, table.remove(deck))
        dealerValue = calculateHandValue(dealerHand)
    end

    -- Determine the result
    local playerValue = gameState.PlayerValue
    if dealerValue > 21 then
        gameState.Result = 'DealerBust'
        Balances[msg.From] = utils.add(Balances[msg.From], gameState.BetAmount * 2)
        Balances[ao.id] = utils.subtract(Balances[ao.id], gameState.BetAmount * 2)
    elseif dealerValue > playerValue then
        gameState.Result = 'DealerWins'
    elseif dealerValue == playerValue then
        gameState.Result = 'Push'
        Balances[msg.From] = utils.add(Balances[msg.From], gameState.BetAmount)
    else
        gameState.Result = 'PlayerWins'
        Balances[msg.From] = utils.add(Balances[msg.From], gameState.BetAmount * 2)
        Balances[ao.id] = utils.subtract(Balances[ao.id], gameState.BetAmount * 2)
    end

    gameState.DealerHand = dealerHand
    gameState.DealerValue = dealerValue

    -- Clear the game state
    GameStates[msg.From] = nil

    -- Send the final game result
    ao.send({
        Target = msg.From,
        Data = json.encode(gameState)
    })
end)

-- Optional handler for doubling down
Handlers.add('double', Handlers.utils.hasMatchingTag('Action', 'Double'), function(msg)
    local gameState = GameStates[msg.From]
    if not gameState then
        sendErrorMessage(msg, "No active game found")
        return
    end

    -- Double the player's bet
    local betAmount = gameState.BetAmount
    Balances[msg.From] = utils.subtract(Balances[msg.From], betAmount)
    Balances[ao.id] = utils.add(Balances[ao.id], betAmount)
    gameState.BetAmount = betAmount * 2

    -- Deal one more card to the player
    local deck = gameState.Deck
    local playerHand = gameState.PlayerHand
    table.insert(playerHand, table.remove(deck))

    -- Calculate updated hand value
    local playerValue = calculateHandValue(playerHand)
    gameState.PlayerValue = playerValue

    -- If the player busts, end the game
    if playerValue > 21 then
        gameState.Result = 'PlayerBust'
        GameStates[msg.From] = nil
    else
        -- After doubling down, the player cannot take more actions, so dealer plays
        Handlers.handlers['stand'](msg)
    end

    -- Send the updated game state
    ao.send({
        Target = msg.From,
        Data = json.encode(gameState)
    })
end)