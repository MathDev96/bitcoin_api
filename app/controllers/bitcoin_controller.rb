require 'net/http'
require 'json'

class BitcoinController < ApplicationController
  # Preço atual
  def show
    price_data = fetch_bitcoin_price

    render json: {
      usd: price_data['usd'],
      brl: price_data['brl'],
      eur: price_data['eur'],
      updated_at: Time.now.strftime('%d/%m/%Y %H:%M:%S')
    }
  end

  # Histórico mensal dos últimos 12 meses
  def history_monthly
    url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365"
    uri = URI(url)
    response = Net::HTTP.get_response(uri)

    unless response.is_a?(Net::HTTPSuccess)
      render json: { error: "Erro HTTP: #{response.code}" }, status: :bad_gateway
      return
    end

    data = JSON.parse(response.body)
    prices = data['prices'] # [[timestamp, price], ...]

    # Agrupa por mês
    monthly = {}
    prices.each do |p|
      time = Time.at(p[0] / 1000)
      key = "#{time.year}-#{time.month}"
      monthly[key] ||= []
      monthly[key] << p[1]
    end

    # Calcula média de cada mês
    monthly_avg = monthly.map { |k, v| [k, (v.sum / v.size).round(2)] }.to_h

    render json: { monthly: monthly_avg }
  rescue StandardError => e
    render json: { error: e.message }, status: :bad_gateway
  end

  private

  def fetch_bitcoin_price
    url = 'https://api.coingecko.com/api/v3/coins/bitcoin'
    uri = URI(url)
    response = Net::HTTP.get_response(uri)

    unless response.is_a?(Net::HTTPSuccess)
      raise "Erro HTTP: #{response.code}"
    end

    data = JSON.parse(response.body)

    usd = data.dig('market_data', 'current_price', 'usd')
    brl = data.dig('market_data', 'current_price', 'brl')
    eur = data.dig('market_data', 'current_price', 'eur')

    if usd.nil? || brl.nil? || eur.nil?
      raise "Dados inválidos da API"
    end

    { 'usd' => usd, 'brl' => brl, 'eur' => eur }
  rescue StandardError => e
    { 'usd' => 0.0, 'brl' => 0.0, 'eur' => 0.0, 'error' => e.message }
  end
end
